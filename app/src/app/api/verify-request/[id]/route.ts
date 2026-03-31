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
        dr.id,
        dr.status,
        dr.firstname,
        dr.lastname,
        dr.email,
        dr.companyname,
        dr.website,
        dr.motivation,
        dr.review_reason,
        dr.created_at,

        di.id AS invitation_id,
        di.token AS invitation_token,
        di.used AS invitation_used,
        di.used_at AS invitation_used_at,
        di.expires_at AS invitation_expires_at,
        di.created_at AS invitation_created_at

      FROM dev_requests dr
      LEFT JOIN LATERAL (
        SELECT id, token, used, used_at, expires_at, created_at
        FROM dev_invitations
        WHERE request_id = dr.id
        ORDER BY created_at DESC
        LIMIT 1
      ) di ON true
      WHERE dr.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Cererea nu a fost găsită." },
        { status: 404 },
      );
    }

    const row = result.rows[0];
    const appUrl =
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    return NextResponse.json(
      {
        id: row.id,
        status: row.status,
        firstname: row.firstname,
        lastname: row.lastname,
        email: row.email,
        companyname: row.companyname,
        website: row.website,
        motivation: row.motivation,
        review_reason: row.review_reason,
        created_at: row.created_at,

        invitation: row.invitation_id
          ? {
              id: row.invitation_id,
              token: row.invitation_token,
              used: row.invitation_used,
              used_at: row.invitation_used_at,
              expires_at: row.invitation_expires_at,
              created_at: row.invitation_created_at,
              registrationUrl: `${appUrl}/complete-dev-registration?token=${row.invitation_token}`,
            }
          : null,
      },
      { status: 200 },
    );
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
