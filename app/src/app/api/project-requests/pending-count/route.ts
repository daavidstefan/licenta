import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import { canManageProjectRequests } from "@/lib/roles";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!canManageProjectRequests(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { rows } = await pg.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM projects
        WHERE status = 'pending'
      `,
    );

    return NextResponse.json({
      count: Number(rows[0]?.count ?? 0),
    });
  } catch (error) {
    console.error("project pending-count failed:", error);
    return NextResponse.json(
      { error: "Failed to load pending project requests count" },
      { status: 500 },
    );
  }
}
