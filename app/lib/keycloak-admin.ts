type KeycloakTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type KeycloakRoleRepresentation = {
  id: string;
  name: string;
  description?: string;
  composite?: boolean;
  clientRole?: boolean;
  containerId?: string;
};

type CreateDeveloperUserInput = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

function getIssuerConfig() {
  const rawIssuer = process.env.KEYCLOAK_ISSUER?.trim();
  const adminClientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID?.trim();
  const adminClientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET?.trim();

  if (!rawIssuer) {
    throw new Error("Lipsește KEYCLOAK_ISSUER din .env");
  }

  if (!adminClientId) {
    throw new Error("Lipsește KEYCLOAK_ADMIN_CLIENT_ID din .env");
  }

  if (!adminClientSecret) {
    throw new Error("Lipsește KEYCLOAK_ADMIN_CLIENT_SECRET din .env");
  }

  const issuer = rawIssuer.replace(/\/+$/, "");
  const match = issuer.match(/^(https?:\/\/.+)\/realms\/([^/]+)$/);

  if (!match) {
    throw new Error(
      "KEYCLOAK_ISSUER are format invalid. Exemplu corect: http://host/realms/licenta",
    );
  }

  const baseUrl = match[1];
  const realm = decodeURIComponent(match[2]);

  return {
    issuer,
    baseUrl,
    realm,
    adminClientId,
    adminClientSecret,
  };
}

async function getAdminAccessToken() {
  const { issuer, adminClientId, adminClientSecret } = getIssuerConfig();

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: adminClientId,
    client_secret: adminClientSecret,
  });

  const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const data = (await res
    .json()
    .catch(() => null)) as KeycloakTokenResponse | null;

  if (!res.ok || !data?.access_token) {
    throw new Error("Nu am putut obține tokenul de admin din Keycloak.");
  }

  return data.access_token;
}

async function adminFetch(path: string, init?: RequestInit) {
  const token = await getAdminAccessToken();
  const { baseUrl, realm } = getIssuerConfig();

  const res = await fetch(`${baseUrl}/admin/realms/${realm}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return res;
}

async function getRealmRoleByName(roleName: string) {
  const { realm, baseUrl } = getIssuerConfig();

  const res = await adminFetch(`/roles/${encodeURIComponent(roleName)}`, {
    method: "GET",
  });

  const raw = await res.text().catch(() => "");
  let data: KeycloakRoleRepresentation | null = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  console.log("KEYCLOAK ROLE LOOKUP DEBUG:", {
    roleName,
    realm,
    url: `${baseUrl}/admin/realms/${realm}/roles/${roleName}`,
    status: res.status,
    body: raw,
  });

  if (!res.ok) {
    throw new Error(
      `Keycloak role lookup failed (${res.status}). Body: ${raw || "gol"}`,
    );
  }

  if (!data?.id || !data?.name) {
    throw new Error(
      `Keycloak a răspuns fără date valide pentru rolul "${roleName}". Body: ${raw || "gol"}`,
    );
  }

  return data;
}

async function createUser(input: CreateDeveloperUserInput) {
  const res = await adminFetch(`/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: "password",
          value: input.password,
          temporary: false,
        },
      ],
    }),
  });

  if (res.status === 409) {
    throw new Error(
      "Există deja un utilizator Keycloak cu acest username sau email.",
    );
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Crearea utilizatorului în Keycloak a eșuat. ${errorText || ""}`.trim(),
    );
  }

  const location = res.headers.get("location");

  if (!location) {
    throw new Error(
      "Keycloak a creat utilizatorul, dar nu a returnat Location header.",
    );
  }

  const userId = location.split("/").pop();

  if (!userId) {
    throw new Error(
      "Nu am putut extrage userId-ul noului utilizator din Keycloak.",
    );
  }

  return userId;
}

async function assignRealmRoleToUser(
  userId: string,
  role: KeycloakRoleRepresentation,
) {
  const res = await adminFetch(
    `/users/${encodeURIComponent(userId)}/role-mappings/realm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          id: role.id,
          name: role.name,
          description: role.description,
          composite: role.composite,
          clientRole: role.clientRole,
          containerId: role.containerId,
        },
      ]),
    },
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Asignarea rolului "${role.name}" a eșuat. ${errorText || ""}`.trim(),
    );
  }
}

export async function createDeveloperUserInKeycloak(
  input: CreateDeveloperUserInput,
) {
  const developerRole = await getRealmRoleByName("developer");
  const userId = await createUser(input);

  await assignRealmRoleToUser(userId, developerRole);

  return {
    userId,
    assignedRole: developerRole.name,
  };
}
