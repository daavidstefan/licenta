// endpoint pentru crearea proiectelor

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const userId = (session.user as any)?.id; // sub Keycloak
  if (!userId) {
    return NextResponse.json({ status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const { name, details, features } = body as {
    name: string;
    details?: string | null;
    features: Array<{ key: string; label: string }>;
  };
  if (!name || !Array.isArray(features)) {
    return NextResponse.json(
      { error: "Lipsesc name sau features[]" },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    // autor
    const userRes = await client.query(
      `SELECT 
        NULLIF(CONCAT_WS(' ', first_name, last_name), '') AS name, 
        username, 
        email 
        FROM users 
        WHERE id = $1 
        LIMIT 1`,
      [userId]
    );
    if (userRes.rowCount === 0) {
      return NextResponse.json(
        { error: "Utilizator inexistent în users" },
        { status: 403 }
      );
    }

    const createdBy =
      userRes.rows[0].name ??
      userRes.rows[0].username ??
      userRes.rows[0].email ??
      "unknown";

    await client.query("BEGIN");

    // slug unic
    const slugBase = slugify(name);
    let slug = slugBase;
    for (let i = 1; ; i++) {
      const { rows } = await client.query(
        `SELECT 1 FROM projects WHERE slug = $1`,
        [slug]
      );
      if (rows.length === 0) break;
      slug = `${slugBase}-${i}`; // daca exista deja slung face ++
    }

    // creeaza proiectul
    const projRes = await client.query(
      `INSERT INTO projects (slug, name, details, created_at, created_by, author_sub_id)
       VALUES ($1, $2, $3, NOW(), $4, $5)
       RETURNING id, slug`,
      [slug, name, details ?? null, createdBy, userId]
    );
    const projectId: number = projRes.rows[0].id;

    // upsert features legate direct la proiect
    for (const f of features) {
      await client.query(
        `INSERT INTO features (project_id, feature_key, label)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, feature_key) DO UPDATE
           SET label = EXCLUDED.label`,
        [projectId, f.key, f.label]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json(
      { id: projectId, slug, created_by: createdBy, author_sub_id: userId },
      { status: 201 }
    );
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("create project failed:", e);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
