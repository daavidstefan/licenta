import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@@/lib/auth";
import { pg } from "@@/lib/db";
import crypto from "crypto";

type ProjectRow = {
  id: number;
  slug: string;
  name: string;
};

type FeatureRow = {
  id: number;
  key: string;
  label: string;
};

function toBase64Url(input: Buffer | string) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf-8");
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signJwtRs256(payload: Record<string, unknown>) {
  const privateKeyPem = process.env.LICENSE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKeyPem) {
    throw new Error("LICENSE_PRIVATE_KEY lipsește din environment.");
  }

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.sign(
    "RSA-SHA256",
    Buffer.from(signingInput, "utf-8"),
    privateKeyPem,
  );

  return `${signingInput}.${toBase64Url(signature)}`;
}

async function loadProject(slug: string) {
  const { rows } = await pg.query<ProjectRow>(
    `
      SELECT id, slug, name
      FROM projects
      WHERE slug = $1
      LIMIT 1
    `,
    [slug],
  );

  return rows[0] ?? null;
}

async function loadProjectFeatures(projectId: number) {
  const { rows } = await pg.query<FeatureRow>(
    `
      SELECT id, feature_key AS key, label
      FROM features
      WHERE project_id = $1
      ORDER BY id ASC
    `,
    [projectId],
  );

  return rows.filter((row) => !!row.key);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const ownerId = (session.user as any)?.id ?? (session.user as any)?.sub;
  if (!ownerId) {
    return NextResponse.json({ error: "Lipsește owner id" }, { status: 401 });
  }

  const project = await loadProject(params.slug);
  if (!project) {
    return NextResponse.json({ error: "Proiect inexistent" }, { status: 404 });
  }

  const existing = await pg.query(
    `
      SELECT id, owner_id, license_key, created_at, expires_at, status, linked_project
      FROM licenses
      WHERE owner_id = $1 AND linked_project = $2
      LIMIT 1
    `,
    [ownerId, project.id],
  );

  if ((existing.rowCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: "Ai deja o licență activă pentru acest proiect!",
        license: existing.rows[0],
      },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => ({}) as any);

  const requestedFeatureKeys: string[] = Array.isArray(body?.featureKeys)
    ? [...new Set(body.featureKeys)]
        .map((x: unknown) => String(x).trim())
        .filter((x: string) => x.length > 0)
    : [];

  const availableFeatures = await loadProjectFeatures(project.id);
  if (availableFeatures.length === 0) {
    return NextResponse.json(
      { error: "Proiectul nu are feature-uri definite." },
      { status: 400 },
    );
  }

  const availableFeatureByKey = new Map(
    availableFeatures.map((feature) => [feature.key, feature]),
  );

  if (requestedFeatureKeys.length === 0) {
    return NextResponse.json(
      { error: "Selecteaza cel putin un feature." },
      { status: 400 },
    );
  }

  const selectedFeatureKeys = requestedFeatureKeys;

  const invalidKeys = selectedFeatureKeys.filter(
    (key) => !availableFeatureByKey.has(key),
  );
  if (invalidKeys.length > 0) {
    return NextResponse.json(
      {
        error: "Unele feature-uri nu aparțin proiectului.",
        invalidFeatureKeys: invalidKeys,
      },
      { status: 400 },
    );
  }

  const selectedFeatures = selectedFeatureKeys
    .map((key) => availableFeatureByKey.get(key))
    .filter((feature): feature is FeatureRow => !!feature);
  const selectedFeatureIds = selectedFeatures.map((feature) => feature.id);

  const now = Math.floor(Date.now() / 1000);

  const client = await pg.connect();
  try {
    await client.query("BEGIN");

    const insertRes = await client.query<{
      id: number;
      owner_id: string;
      created_at: string;
      expires_at: string | null;
      status: string;
      linked_project: number;
    }>(
      `
        INSERT INTO licenses (owner_id, license_key, created_at, expires_at, status, linked_project)
        VALUES ($1, $2, NOW(), NULL, 'active', $3)
        RETURNING id, owner_id, created_at, expires_at, status, linked_project
      `,
      [ownerId, "__PENDING__", project.id],
    );

    const license = insertRes.rows[0];

    await client.query(
      `
        INSERT INTO license_features (license_id, feature_id)
        SELECT $1, unnest($2::int[])
        ON CONFLICT DO NOTHING
      `,
      [license.id, selectedFeatureIds],
    );

    // claim stabil = identificator constant pentru aplicație
    // momentan folosim slug-ul proiectului
    const stableProjectKey = project.slug;

    const payload = {
      iss: "licenta",
      sub: `license:${license.id}`,
      owner_id: ownerId,
      project_id: project.id,
      project_key: stableProjectKey,
      aud: stableProjectKey,
      feature_keys: selectedFeatureKeys,
      status: "active",
      iat: now,
      // exp: now + 60 * 60 * 24 * 30, // opțional
    };

    const signedJwt = signJwtRs256(payload);

    await client.query(
      `
        UPDATE licenses
        SET license_key = $1
        WHERE id = $2
      `,
      [signedJwt, license.id],
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        message: "Licența JWT a fost generată cu succes!",
        license: {
          ...license,
          license_key: signedJwt,
        },
        payloadPreview: payload,
      },
      { status: 201 },
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("GEN_KEY_ERR:", error);

    return NextResponse.json(
      { error: "Eroare la generarea licenței." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
