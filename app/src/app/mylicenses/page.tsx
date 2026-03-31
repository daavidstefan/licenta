// pagina cu licentele mele
// trimit props catre /app/components/my-licenses-table

import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import MyLicensesTable from "@/components/my-licenses-table";

type LicenseRow = {
  id: number;
  owner_id: string;
  license_key: string;
  created_at: Date;
  expires_at: string;
  status: string;
  linked_project: string;
};

export default async function MyLicensesPage() {
  const session = await getServerSession(authOptions);
  const userSub = (session?.user as any)?.id || (session?.user as any)?.sub;
  if (!userSub) return <div className="p-6">Nu s-a gasit sub-id.</div>;

  const { rows: licenses } = await pg.query<LicenseRow>(
    `SELECT l.id,
          l.owner_id,
          l.license_key,
          l.created_at,
          l.expires_at,
          l.status,
          p.name AS linked_project
   FROM licenses l
   JOIN projects p ON p.id = l.linked_project
   WHERE l.owner_id = $1
   ORDER BY l.created_at DESC`,
    [userSub]
  );

  return <MyLicensesTable licenses={licenses} />;
}
