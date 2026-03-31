// pagina cu detaliile contului

import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import MyProjectsTable from "@/components/my-projects-table";
import MyAccountDetailsCard from "@/components/my-account-details";

type ProjectRow = {
  id: number;
  name: string;
  created_at: string;
  slug: string;
};

type AccountDetails = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

export default async function MyProjectsPage() {
  const session = await getServerSession(authOptions);
  const userSub = (session?.user as any)?.id || (session?.user as any)?.sub;
  if (!userSub) return <div className="p-6">Nu s-a găsit sub-id.</div>;

  const { rows: details } = await pg.query<AccountDetails>(
    `SELECT id, email, username, first_name, last_name, created_at
     FROM users
     WHERE id = $1`,
    [userSub]
  );

  return <MyAccountDetailsCard details={details} />;
  // aici va trebui sa trimit details ca props catre pagina care sa afiseze detaliile contului
}
