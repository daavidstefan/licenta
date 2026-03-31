// rute api pentru actualizarea si stergerea unui proiect

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const meSub = (session.user as any)?.id || (session.user as any)?.sub;
  if (!meSub) {
    return NextResponse.json({ error: "Lipsește sub (id)" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await req.json();
  const { name, details } = body as { name: string; details: string };

  try {
    const { rows } = await pg.query<{
      author_sub_id: string;
    }>(`SELECT author_sub_id FROM projects WHERE slug = $1 LIMIT 1`, [slug]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Proiect inexistent" },
        { status: 404 }
      );
    }

    const isOwner = rows[0].author_sub_id === meSub;
    const isAdmin = (session.user as any)?.roles?.includes("admin");

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Nu ai permisiuni" }, { status: 403 });
    }

    // update proiect
    const result = await pg.query(
      `UPDATE projects
       SET name = $1, details = $2
       WHERE slug = $3
       RETURNING id, slug, name, details, created_at`,
      [name, details, slug]
    );

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const meSub = (session.user as any)?.id || (session.user as any)?.sub;
  if (!meSub) {
    return NextResponse.json({ error: "Lipsește sub (id)" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const { rows } = await pg.query<{ author_sub_id: string }>(
      `SELECT author_sub_id FROM projects WHERE slug = $1 LIMIT 1`,
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Proiect inexistent" },
        { status: 404 }
      );
    }

    const isOwner = rows[0].author_sub_id === meSub;
    const isAdmin = (session.user as any)?.roles?.includes("admin");

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Nu ai permisiuni" }, { status: 403 });
    }

    await pg.query(`DELETE FROM projects WHERE slug = $1`, [slug]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
