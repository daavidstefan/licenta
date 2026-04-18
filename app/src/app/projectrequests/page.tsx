import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import ProjectRequestsTable from "@/components/project-requests-table";
import { canManageProjectRequests } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{
  sort?: string;
  order?: "asc" | "desc";
  status?: "pending" | "approved" | "rejected";
}>;

type ProjectRequestRow = {
  id: number;
  name: string;
  created_by: string | null;
  status: string;
  created_at: string;
};

export default async function ProjectRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!canManageProjectRequests(userRole)) {
    redirect("/forbidden");
  }

  const sp = await searchParams;

  const allowedSort: Record<string, string> = {
    name: "name",
    created_at: "created_at",
  };

  const allowedStatuses = new Set(["pending", "approved", "rejected"]);
  const sort = allowedSort[sp.sort ?? "created_at"] ?? "created_at";
  const order = sp.order === "asc" ? "ASC" : "DESC";
  const status =
    sp.status && allowedStatuses.has(sp.status) ? sp.status : undefined;

  const params: string[] = [];
  let sql = `
    SELECT id, name, created_by, status, created_at
    FROM projects
  `;

  if (status) {
    params.push(status);
    sql += ` WHERE status = $${params.length}`;
  }

  sql += ` ORDER BY ${sort} ${order}`;

  const { rows: requests } = await pg.query<ProjectRequestRow>(sql, params);

  return <ProjectRequestsTable requests={requests} />;
}
