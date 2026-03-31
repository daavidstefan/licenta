import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const KC_BASE = process.env.KEYCLOAK_BASE!;
const KC_REALM = process.env.KEYCLOAK_REALM!;
const KC_ADMIN = process.env.KEYCLOAK_ADMIN!;
const KC_ADMIN_PASS = process.env.KEYCLOAK_ADMIN_PASSWORD!;

async function getAdminAccessToken() {
  const res = await fetch(
    `${KC_BASE}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "admin-cli",
        username: KC_ADMIN,
        password: KC_ADMIN_PASS,
        grant_type: "password",
      }),
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Eroare la server! Încearcă mai tarziu.");
  const data = await res.json();
  return data.access_token as string;
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined; // = sub

  if (!userId) {
    return NextResponse.json({ error: "Nu există sesiune." }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // tombstone user
    await client.query(
      `INSERT INTO users (id, email, username, name)
       VALUES ($1, NULL, 'deleted_user', 'Deleted User')
       ON CONFLICT (id) DO NOTHING`,
      ["DELETED_USER"]
    );

    await client.query(
      `UPDATE projects
       SET author_sub_id = 'DELETED_USER',
           created_by    = 'deleted_user'
       WHERE author_sub_id = $1`,
      [userId]
    );

    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      {
        error: `Eroare la baza de date: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  try {
    const adminToken = await getAdminAccessToken();
    const resp = await fetch(
      `${KC_BASE}/admin/realms/${KC_REALM}/users/${userId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: text || "Ștergerea contului a eșuat!" },
        { status: resp.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Eroare la server." },
      { status: 500 }
    );
  }
}
