import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "ID-ul cererii lipsește." },
      { status: 400 },
    );
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `
    SELECT
        id,
        status,
        firstname,
        lastname,
        email,
        companyname,
        motivation,
        created_at
    FROM dev_requests
    WHERE id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Cererea nu a fost găsită." },
        { status: 404 },
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    console.error("verify-request failed:", error);

    if (error.code === "22P02") {
      return NextResponse.json(
        { error: "Format ID invalid." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Eroare la verificarea cererii." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
