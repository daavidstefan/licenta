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
  linked_project_id: number;
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
  linked_project_id: number;
  linked_project: string;
  feature_labels: string[];
};

type FeatureLabelRow = {
  project_id: number;
  key: string;
  label: string;
};

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf-8");
}

function decodeLicenseFeatureKeys(licenseKey: string) {
  const payloadSegment = licenseKey.split(".")[1];
  if (!payloadSegment) return [];

  try {
    const payload = JSON.parse(decodeBase64Url(payloadSegment)) as {
      feature_keys?: unknown;
    };

    if (!Array.isArray(payload.feature_keys)) return [];

    return payload.feature_keys
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value): value is string => value.length > 0);
  } catch {
    return [];
  }
}

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
        p.id AS linked_project_id,
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

  const rowsWithDecodedFeatures = rows.map((row) => {
    const featureLabels = Array.isArray(row.feature_labels)
      ? row.feature_labels.filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
      : [];

    return {
      row,
      featureLabels,
      featureKeysFromJwt: decodeLicenseFeatureKeys(row.license_key),
    };
  });

  const rowsNeedingFallback = rowsWithDecodedFeatures.filter(
    ({ featureLabels, featureKeysFromJwt }) =>
      featureLabels.length === 0 && featureKeysFromJwt.length > 0,
  );

  const projectIds = [
    ...new Set(rowsNeedingFallback.map(({ row }) => row.linked_project_id)),
  ];
  const featureKeys = [
    ...new Set(
      rowsNeedingFallback.flatMap(({ featureKeysFromJwt }) =>
        featureKeysFromJwt,
      ),
    ),
  ];

  const labelsByProjectAndKey = new Map<string, string>();

  if (projectIds.length > 0 && featureKeys.length > 0) {
    const { rows: featureRows } = await pg.query<FeatureLabelRow>(
      `
        SELECT project_id, feature_key AS key, label
        FROM features
        WHERE project_id = ANY($1::int[])
          AND feature_key = ANY($2::text[])
      `,
      [projectIds, featureKeys],
    );

    for (const feature of featureRows) {
      labelsByProjectAndKey.set(
        `${feature.project_id}:${feature.key}`,
        feature.label,
      );
    }
  }

  const licenses: LicenseRow[] = rowsWithDecodedFeatures.map(
    ({ row, featureLabels, featureKeysFromJwt }) => {
      const fallbackLabels = featureKeysFromJwt.map(
        (key) =>
          labelsByProjectAndKey.get(`${row.linked_project_id}:${key}`) ?? key,
      );

      return {
        ...row,
        feature_labels:
          featureLabels.length > 0 ? featureLabels : fallbackLabels,
      };
    },
  );

  return <MyLicensesTable licenses={licenses} />;
}
