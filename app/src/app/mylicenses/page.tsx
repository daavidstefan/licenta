import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import MyLicensesTable from "@/components/my-licenses-table";

type RawLicenseRow = {
  id: number;
  owner_id: string;
  license_key: string;
  created_at: string | Date;
  expires_at: string | Date | null;
  status: string;
  linked_project: string;
  feature_labels: string[] | null;
};

type LicenseRow = {
  id: number;
  owner_id: string;
  license_key: string;
  created_at: string | Date;
  expires_at: string | Date | null;
  status: string;
  linked_project: string;
  feature_labels: string[];
};

export default async function MyLicensesPage() {
  const session = await getServerSession(authOptions);
  const userSub = (session?.user as any)?.id || (session?.user as any)?.sub;

  if (!userSub) {
    return <div className="p-6">Nu s-a găsit sub-id.</div>;
  }

  const { rows } = await pg.query<RawLicenseRow>(
    `SELECT
        l.id,
        l.owner_id,
        l.license_key,
        l.created_at,
        l.expires_at,
        l.status,
        p.name AS linked_project,
        ARRAY(
          SELECT f.label
          FROM license_features lf
          JOIN features f ON f.id = lf.feature_id
          WHERE lf.license_id = l.id
          ORDER BY f.label
        ) AS feature_labels
     FROM licenses l
     JOIN projects p
       ON p.id = l.linked_project
     WHERE l.owner_id = $1
     ORDER BY l.created_at DESC`,
    [userSub],
  );

  const licenses: LicenseRow[] = rows.map((row) => ({
    ...row,
    feature_labels: Array.isArray(row.feature_labels)
      ? row.feature_labels.filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
      : [],
  }));

  return <MyLicensesTable licenses={licenses} />;
}
