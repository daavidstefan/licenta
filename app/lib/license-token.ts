import crypto from "crypto";

export type SignedLicensePayload = {
  iss: string;
  sub: string;
  owner_id: string;
  project_id: number;
  feature_keys: string[];
  status: "active" | "revoked" | "expired";
  iat: number;
  exp?: number;
};

function toBase64Url(input: Buffer | string): string {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");

  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getPrivateKey(): string {
  const raw = process.env.LICENSE_PRIVATE_KEY;

  if (!raw || !raw.trim()) {
    throw new Error("LICENSE_PRIVATE_KEY is missing.");
  }

  return raw.replace(/\\n/g, "\n");
}

export function signLicenseToken(args: {
  licenseId: number;
  ownerId: string;
  projectId: number;
  featureKeys: string[];
  status: "active" | "revoked" | "expired";
  expiresAt?: string | Date | null;
}) {
  const issuer = process.env.LICENSE_TOKEN_ISSUER?.trim() || "licenta-platform";

  const now = Math.floor(Date.now() / 1000);

  const exp =
    args.expiresAt != null
      ? Math.floor(new Date(args.expiresAt).getTime() / 1000)
      : undefined;

  const payload: SignedLicensePayload = {
    iss: issuer,
    sub: `license:${args.licenseId}`,
    owner_id: args.ownerId,
    project_id: args.projectId,
    feature_keys: [...args.featureKeys].sort(),
    status: args.status,
    iat: now,
    ...(typeof exp === "number" && Number.isFinite(exp) ? { exp } : {}),
  };

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(getPrivateKey());
  const encodedSignature = toBase64Url(signature);

  return {
    token: `${signingInput}.${encodedSignature}`,
    payload,
  };
}
