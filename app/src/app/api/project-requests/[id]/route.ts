import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import {
  sendProjectApprovalEmail,
  sendProjectRejectionEmail,
} from "@@/lib/mailer";
import { canManageProjectRequests } from "@/lib/roles";

type AllowedStatus = "approved" | "rejected";

type ProjectReviewRow = {
  id: number;
  name: string;
  status: string;
  review_reason: string | null;
  created_by: string | null;
  author_email: string | null;
  author_first_name: string | null;
  author_username: string | null;
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

  if (!canManageProjectRequests(userRole)) {
    return NextResponse.json({ error: "Nu ai permisiuni" }, { status: 403 });
  }

  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId)) {
    return NextResponse.json({ error: "ID invalid" }, { status: 400 });
  }

  let body: { status?: AllowedStatus; reviewReason?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const nextStatus = body.status;
  const reviewReason = body.reviewReason?.trim() || null;
  const reviewedByAdminId = (session.user as any)?.id ?? null;

  if (!nextStatus || !["approved", "rejected"].includes(nextStatus)) {
    return NextResponse.json(
      { error: "Status invalid. Sunt permise doar approved sau rejected." },
      { status: 400 },
    );
  }

  if (nextStatus === "rejected" && !reviewReason) {
    return NextResponse.json(
      { error: "Motivul respingerii este obligatoriu." },
      { status: 400 },
    );
  }

  const client = await pg.connect();

  try {
    await client.query("BEGIN");

    const { rows: existingRows } = await client.query<ProjectReviewRow>(
      `
        SELECT
          p.id,
          p.name,
          p.status,
          p.review_reason,
          p.created_by,
          u.email AS author_email,
          u.first_name AS author_first_name,
          u.username AS author_username
        FROM projects p
        LEFT JOIN users u
          ON u.id = p.author_sub_id
        WHERE p.id = $1
        LIMIT 1
        FOR UPDATE OF p
      `,
      [projectId],
    );

    if (existingRows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Cererea nu a fost gasita." },
        { status: 404 },
      );
    }

    const existingProject = existingRows[0];

    if (existingProject.status !== "pending") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Doar cererile pending pot fi actualizate." },
        { status: 409 },
      );
    }

    const finalReviewReason = nextStatus === "rejected" ? reviewReason : null;

    const { rows: updatedRows } = await client.query<ProjectReviewRow>(
      `
        UPDATE projects
        SET
          status = $1,
          review_reason = $2,
          reviewed_at = NOW(),
          reviewed_by_admin_id = $3
        WHERE id = $4
        RETURNING
          id,
          name,
          status,
          review_reason,
          created_by,
          NULL::text AS author_email,
          NULL::text AS author_first_name,
          NULL::text AS author_username
      `,
      [nextStatus, finalReviewReason, reviewedByAdminId, projectId],
    );

    await client.query("COMMIT");

    const updatedProject = {
      ...updatedRows[0],
      author_email: existingProject.author_email,
      author_first_name: existingProject.author_first_name,
      author_username: existingProject.author_username,
    };

    let warning: string | null = null;

    if (!updatedProject.author_email) {
      warning =
        "Statusul a fost actualizat, dar emailul dezvoltatorului nu exista.";
    } else {
      try {
        const developerName =
          updatedProject.author_first_name ??
          updatedProject.created_by ??
          updatedProject.author_username;

        if (nextStatus === "approved") {
          await sendProjectApprovalEmail({
            to: updatedProject.author_email,
            developerName,
            projectName: updatedProject.name,
          });
        } else {
          await sendProjectRejectionEmail({
            to: updatedProject.author_email,
            developerName,
            projectName: updatedProject.name,
            reviewReason: updatedProject.review_reason,
          });
        }
      } catch (emailError) {
        console.error("send project review email failed:", emailError);
        warning = "Statusul a fost actualizat, dar emailul nu a putut fi trimis.";
      }
    }

    return NextResponse.json(
      {
        project: updatedProject,
        ...(warning ? { warning } : {}),
      },
      { status: 200 },
    );
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("update project request failed:", error);

    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  } finally {
    client.release();
  }
}
