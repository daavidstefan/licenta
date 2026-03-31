import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import { sendDeveloperApprovalEmail } from "@@/lib/mailer";

type AllowedStatus = "approved" | "rejected";

type DevRequestRow = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  companyname: string;
  website: string;
  motivation: string;
  status: string;
  created_at: string;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const userRole = (session.user as any)?.role;

  if (userRole !== "admin") {
    return NextResponse.json({ error: "Nu ai permisiuni" }, { status: 403 });
  }

  const { id } = await params;

  let body: { status?: AllowedStatus };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const nextStatus = body.status;

  if (!nextStatus || !["approved", "rejected"].includes(nextStatus)) {
    return NextResponse.json(
      { error: "Status invalid. Sunt permise doar approved sau rejected." },
      { status: 400 },
    );
  }

  const client = await pg.connect();

  try {
    await client.query("BEGIN");

    const { rows: existingRows } = await client.query<DevRequestRow>(
      `
        SELECT
          id,
          firstname,
          lastname,
          email,
          companyname,
          website,
          motivation,
          status,
          created_at
        FROM dev_requests
        WHERE id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [id],
    );

    if (existingRows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Cererea nu a fost găsită" },
        { status: 404 },
      );
    }

    const existingRequest = existingRows[0];

    if (existingRequest.status !== "pending") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Doar cererile pending pot fi actualizate." },
        { status: 409 },
      );
    }

    const { rows: updatedRows } = await client.query<DevRequestRow>(
      `
        UPDATE dev_requests
        SET status = $1
        WHERE id = $2
        RETURNING
          id,
          firstname,
          lastname,
          email,
          companyname,
          website,
          motivation,
          status,
          created_at
      `,
      [nextStatus, id],
    );

    const updatedRequest = updatedRows[0];

    if (nextStatus === "rejected") {
      await client.query("COMMIT");
      return NextResponse.json(updatedRequest, { status: 200 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { rows: invitationRows } = await client.query<{
      id: string;
      token: string;
      email: string;
      expires_at: string;
      used: boolean;
      created_at: string;
    }>(
      `
        INSERT INTO dev_invitations (
          request_id,
          email,
          token,
          expires_at
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, token, email, expires_at, used, created_at
      `,
      [updatedRequest.id, updatedRequest.email, token, expiresAt],
    );

    const invitation = invitationRows[0];

    await client.query("COMMIT");

    const appUrl =
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const registrationUrl = `${appUrl}/complete-dev-registration?token=${invitation.token}`;

    let warning: string | null = null;

    try {
      await sendDeveloperApprovalEmail({
        to: updatedRequest.email,
        firstName: updatedRequest.firstname,
        companyName: updatedRequest.companyname,
        registrationUrl,
        expiresAt: invitation.expires_at,
      });
    } catch (emailError) {
      console.error("send developer approval email failed:", emailError);
      warning = "Cererea a fost aprobată, dar emailul nu a putut fi trimis.";
    }

    return NextResponse.json(
      {
        request: updatedRequest,
        invitation: {
          ...invitation,
          registrationUrl,
        },
        ...(warning ? { warning } : {}),
      },
      { status: 200 },
    );
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("update dev_request failed:", error);

    if (error.code === "22P02") {
      return NextResponse.json({ error: "Format ID invalid" }, { status: 400 });
    }

    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Există deja o invitație pentru această cerere." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  } finally {
    client.release();
  }
}
