// rute api pentru gestionarea feature urilor unui proiect

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";

// incarca proiectul din baza de date
async function loadProject(slug: string) {
  const { rows } = await pg.query<{ id: number; author_sub_id: string }>(
    `SELECT id, author_sub_id FROM projects WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

// verifica daca utilizatorul poate edita proiectul
function canEditProject(session: any, project: { author_sub_id: string }) {
  const meSub = session?.user?.id ?? session?.user?.sub ?? null;
  const roles: string[] | undefined = session?.user?.roles;
  const isAdmin = roles?.includes("admin") ?? false;
  return !!meSub && (meSub === project.author_sub_id || isAdmin);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const project = await loadProject(slug);
  if (!project)
    return NextResponse.json({ error: "Proiect inexistent" }, { status: 404 });
  if (!canEditProject(session, project))
    return NextResponse.json({ error: "Fără permisiuni" }, { status: 403 });

  const { label } = await req.json().catch(() => ({} as any));
  const clean = String(label ?? "").trim();
  if (!clean)
    return NextResponse.json({ error: "Label lipsă" }, { status: 400 });

  const key =
    clean
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || null;

  const { rows } = await pg.query<{
    id: number;
    key: string | null;
    label: string;
  }>(
    `INSERT INTO features (project_id, feature_key, label)
     VALUES ($1, $2, $3)
     ON CONFLICT (project_id, feature_key) DO UPDATE
       SET label = EXCLUDED.label
     RETURNING id, feature_key AS key, label`,
    [project.id, key, clean]
  );

  return NextResponse.json(rows[0], { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });

  const project = await loadProject(slug);
  if (!project)
    return NextResponse.json({ error: "Proiect inexistent" }, { status: 404 });
  if (!canEditProject(session, project))
    return NextResponse.json({ error: "Fără permisiuni" }, { status: 403 });

  const body = await req.json().catch(() => ({} as any));
  const ids: number[] = Array.isArray(body?.featureIds) ? body.featureIds : [];
  if (ids.length === 0)
    return NextResponse.json({ error: "featureIds lipsă" }, { status: 400 });

  await pg.query(
    `DELETE FROM features
     WHERE project_id = $1
       AND id = ANY ($2::int[])`,
    [project.id, ids]
  );

  return NextResponse.json({ ok: true });
}
