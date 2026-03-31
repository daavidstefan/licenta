import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "ID-ul cererii lipsește" },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    const selectQuery = `
      SELECT id, status, firstname, lastname, email, companyname, created_at
      FROM dev_requests 
      WHERE id = $1
    `;

    const result = await client.query(selectQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Cererea nu a fost găsită" },
        { status: 404 }
      );
    }

    const requestData = result.rows[0];
    return NextResponse.json(requestData, { status: 200 });
  } catch (e: any) {
    console.error("verify dev_request failed:", e);

    if (e.code === "22P02") {
      return NextResponse.json({ error: "Format ID invalid" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
