import { NextRequest, NextResponse } from "next/server";
import { pg } from "@@/lib/db";

type InvitationRow = {
  invitation_id: string;
  token: string;
  email: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
  request_id: string;
  firstname: string;
  lastname: string;
  companyname: string;
  website: string;
  motivation: string;
  request_status: string;
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Tokenul lipsește." }, { status: 400 });
  }

  try {
    const { rows } = await pg.query<InvitationRow>(
      `
        SELECT
          di.id AS invitation_id,
          di.token,
          di.email,
          di.expires_at,
          di.used,
          di.used_at,
          di.created_at,
          dr.id AS request_id,
          dr.firstname,
          dr.lastname,
          dr.companyname,
          dr.website,
          dr.motivation,
          dr.status AS request_status
        FROM dev_invitations di
        INNER JOIN dev_requests dr
          ON dr.id = di.request_id
        WHERE di.token = $1
        LIMIT 1
      `,
      [token],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invitația nu a fost găsită." },
        { status: 404 },
      );
    }

    const invitation = rows[0];
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (invitation.request_status !== "approved") {
      return NextResponse.json(
        { error: "Cererea asociată nu este aprobată." },
        { status: 409 },
      );
    }

    if (invitation.used) {
      return NextResponse.json(
        { error: "Invitația a fost deja folosită." },
        { status: 409 },
      );
    }

    if (expiresAt <= now) {
      return NextResponse.json(
        { error: "Invitația a expirat." },
        { status: 410 },
      );
    }

    return NextResponse.json(
      {
        valid: true,
        invitation: {
          id: invitation.invitation_id,
          token: invitation.token,
          email: invitation.email,
          expires_at: invitation.expires_at,
          created_at: invitation.created_at,
        },
        request: {
          id: invitation.request_id,
          firstname: invitation.firstname,
          lastname: invitation.lastname,
          companyname: invitation.companyname,
          website: invitation.website,
          motivation: invitation.motivation,
          status: invitation.request_status,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("validate dev invitation failed:", error);

    if (error.code === "22P02") {
      return NextResponse.json(
        { error: "Format token invalid." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Eroare server." }, { status: 500 });
  }
}
