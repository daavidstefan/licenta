// pagina care afiseaza lista tuturor proiectelor
// citirea parametrilor din url
// interogarea db
// trimite props catre \components\projects-table

export const dynamic = "force-dynamic";
export const revalidate = 0;

import ProjectsTable from "@/components/projects-table";
import { pg } from "@@/lib/db";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    order?: "asc" | "desc";
    name?: string;
    author?: string;
  }>;
}) {
  const sp = await searchParams;

  const allowed: Record<string, string> = {
    id: "id",
    name: "name",
    created_at: "created_at",
  };

  const sort = allowed[sp.sort ?? "id"] ?? "id";
  const order = sp.order === "desc" ? "DESC" : "ASC";

  const nameQ = (sp.name ?? "").toString().trim();
  const authorQ = (sp.author ?? "").toString().trim();

  const params: any[] = [];
  let sql = `SELECT id, name, details, slug, created_at, created_by FROM projects`;
  let conditions: string[] = [];

  if (nameQ) {
    params.push(`%${nameQ}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }

  if (authorQ) {
    params.push(`%${authorQ}%`);
    conditions.push(`created_by ILIKE $${params.length}`);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += ` ORDER BY ${sort} ${order}`;

  const { rows: projects } = await pg.query(sql, params);

  return <ProjectsTable projects={projects} />;
}
