import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import DevRequestsTable from "@/components/dev-requests-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{
  sort?: string;
  order?: "asc" | "desc";
  status?: "pending" | "approved" | "rejected";
}>;

export default async function DevRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (userRole !== "admin") {
    return <div className="p-6">Nu ai acces la această pagină.</div>;
  }

  const sp = await searchParams;

  const allowedSort: Record<string, string> = {
    companyname: "companyname",
    created_at: "created_at",
  };

  const allowedStatuses = new Set(["pending", "approved", "rejected"]);

  const sort = allowedSort[sp.sort ?? "created_at"] ?? "created_at";
  const order = sp.order === "asc" ? "ASC" : "DESC";
  const status =
    sp.status && allowedStatuses.has(sp.status) ? sp.status : undefined;

  const params: string[] = [];
  let sql = `
    SELECT id, firstname, lastname, email, companyname, website, motivation, status, created_at
    FROM dev_requests
  `;

  const conditions: string[] = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += ` ORDER BY ${sort} ${order}`;

  const { rows: requests } = await pg.query(sql, params);

  return <DevRequestsTable requests={requests} />;
}
