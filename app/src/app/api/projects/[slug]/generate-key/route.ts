import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import crypto from "crypto";

async function loadProject(slug: string) {
  const { rows } = await pg.query<{ id: number }>(
    `SELECT id FROM projects WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const project = await loadProject(params.slug);
  if (!project)
    return NextResponse.json({ error: "Proiect inexistent" }, { status: 404 });

  const ownerId = (session.user as any)?.id ?? (session.user as any)?.sub;

  const existing = await pg.query(
    `SELECT id, owner_id, license_key, created_at, expires_at, status, linked_project
       FROM licenses
      WHERE owner_id = $1 AND linked_project = $2
      LIMIT 1`,
    [ownerId, project.id]
  );
  if (existing.rowCount! > 0) {
    return NextResponse.json(
      {
        error: "Ai deja o licență activă pentru acest proiect!",
        license: existing.rows[0],
      },
      { status: 409 }
    );
  }

  const licenseKey = crypto.randomBytes(16).toString("hex");

  try {
    const { rows } = await pg.query(
      `INSERT INTO licenses (owner_id, license_key, created_at, expires_at, status, linked_project)
       VALUES ($1, $2, NOW(), NULL, 'active', $3)
       RETURNING id, owner_id, created_at, expires_at, status, linked_project`,
      [ownerId, licenseKey, project.id]
    );

    return NextResponse.json(
      {
        message: "Licența a fost generata cu succes!",
        license: rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("GEN_KEY_ERR:", error);
    return NextResponse.json(
      { error: "Eroare la generarea licenței." },
      { status: 500 }
    );
  }
}
