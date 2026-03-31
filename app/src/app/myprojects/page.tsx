// pagina cu proiectele mele

import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import MyProjectsTable from "@/components/my-projects-table";

type ProjectRow = {
  id: number;
  name: string;
  created_at: string;
  slug: string;
};

export default async function MyProjectsPage() {
  const session = await getServerSession(authOptions);
  const userSub = (session?.user as any)?.id || (session?.user as any)?.sub;
  if (!userSub) return <div className="p-6">Nu s-a găsit sub-id.</div>;

  const { rows: projects } = await pg.query<ProjectRow>(
    `SELECT id, name, created_at, slug
     FROM projects
     WHERE author_sub_id = $1
     ORDER BY created_at DESC`,
    [userSub]
  );

  return <MyProjectsTable projects={projects} />;
}
