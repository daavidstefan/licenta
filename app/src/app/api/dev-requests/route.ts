import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// dev_requests: id, firstname, lastname, email, companyname, website, motivation, status

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
    console.log("Backend [PRIMEȘTE]:", body);
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const { firstName, lastName, email, companyName, website, motivation } =
    body as {
      firstName: string;
      lastName: string;
      email: string;
      companyName: string;
      website: string;
      motivation: string;
    };

  if (
    !firstName ||
    !lastName ||
    !email ||
    !companyName ||
    !website ||
    !motivation
  ) {
    return NextResponse.json(
      { error: "Lipsesc câmpuri obligatorii" },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    const insertQuery = `
      INSERT INTO dev_requests 
        (firstname, lastname, email, companyname, website, motivation, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id
    `;

    const insertValues = [
      firstName,
      lastName,
      email,
      companyName,
      website,
      motivation,
    ];

    const result = await client.query(insertQuery, insertValues);

    console.log("Backend [REZULTAT QUERY]:", result.rows);

    if (result.rows.length === 0) {
      throw new Error("Inserarea a eșuat, nu s-a returnat niciun ID.");
    }

    const requestId = result.rows[0].id;

    console.log("Backend [SUCCES]: Trimite înapoi ID-ul:", requestId);
    return NextResponse.json({ id: requestId }, { status: 201 });
  } catch (e: any) {
    console.error("create dev_request failed:", e);

    if (e.code === "23505") {
      return NextResponse.json(
        { error: "Există deja o cerere cu acest e-mail" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
