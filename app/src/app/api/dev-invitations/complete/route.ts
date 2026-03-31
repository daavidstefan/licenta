import { NextRequest, NextResponse } from "next/server";
import { pg } from "@@/lib/db";
import { createDeveloperUserInKeycloak } from "@@/lib/keycloak-admin";

type CompleteBody = {
  token?: string;
  username?: string;
  password?: string;
};

type InvitationRow = {
  invitation_id: string;
  request_id: string;
  email: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  request_status: string;
  firstname: string;
  lastname: string;
};

export async function POST(req: NextRequest) {
  let body: CompleteBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid." }, { status: 400 });
  }

  const token = body.token?.trim();
  const username = body.username?.trim();
  const password = body.password?.trim();

  if (!token || !username || !password) {
    return NextResponse.json(
      { error: "Tokenul, username-ul și parola sunt obligatorii." },
      { status: 400 },
    );
  }

  if (username.length < 3) {
    return NextResponse.json(
      { error: "Username-ul trebuie să aibă minimum 3 caractere." },
      { status: 400 },
    );
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username-ul poate conține doar litere, cifre, punct, underscore și minus.",
      },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Parola trebuie să aibă minimum 8 caractere." },
      { status: 400 },
    );
  }

  const client = await pg.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query<InvitationRow>(
      `
        SELECT
          di.id AS invitation_id,
          di.request_id,
          di.email,
          di.expires_at,
          di.used,
          di.used_at,
          dr.status AS request_status,
          dr.firstname,
          dr.lastname
        FROM dev_invitations di
        INNER JOIN dev_requests dr
          ON dr.id = di.request_id
        WHERE di.token = $1
        LIMIT 1
        FOR UPDATE OF di
      `,
      [token],
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Invitația nu a fost găsită." },
        { status: 404 },
      );
    }

    const invitation = rows[0];

    if (invitation.request_status !== "approved") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Cererea asociată nu este aprobată." },
        { status: 409 },
      );
    }

    if (invitation.used) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Invitația a fost deja folosită." },
        { status: 409 },
      );
    }

    if (new Date(invitation.expires_at) <= new Date()) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Invitația a expirat." },
        { status: 410 },
      );
    }

    const result = await createDeveloperUserInKeycloak({
      username,
      email: invitation.email,
      firstName: invitation.firstname,
      lastName: invitation.lastname,
      password,
    });

    await client.query(
      `
    INSERT INTO users (
      id,
      email,
      username,
      first_name,
      last_name,
      role
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role
  `,
      [
        result.userId,
        invitation.email,
        username,
        invitation.firstname,
        invitation.lastname,
        "developer",
      ],
    );

    await client.query(
      `
    UPDATE dev_invitations
    SET used = TRUE,
        used_at = NOW()
    WHERE id = $1
  `,
      [invitation.invitation_id],
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: "Contul de developer a fost creat cu succes.",
        user: {
          keycloakId: result.userId,
          email: invitation.email,
          username,
          role: result.assignedRole,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("complete dev invitation failed:", error);

    const message =
      typeof error?.message === "string"
        ? error.message
        : "Eroare server la crearea contului.";

    const status = message.includes("Există deja un utilizator Keycloak")
      ? 409
      : 500;

    return NextResponse.json({ error: message }, { status });
  } finally {
    client.release();
  }
}
