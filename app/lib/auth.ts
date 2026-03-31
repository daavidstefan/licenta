// gestioneaza autentificarea cu keycloak si setarile nextauth

import { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { pg } from "@@/lib/db";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "jwt-decode";

interface KeycloakJwtPayload extends JwtPayload {
  realm_access?: {
    roles: string[];
  };
}

function pickRole(roles: string[]): "admin" | "developer" | "client" | null {
  return (
    (roles.includes("admin") && "admin") ||
    (roles.includes("developer") && "developer") ||
    (roles.includes("client") && "client") ||
    null
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 3600,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      const id = account?.providerAccountId ?? (profile as any)?.sub;
      if (!id) return false;

      let decoded: any = {};
      try {
        decoded = jwtDecode<any>(account?.access_token ?? "");
      } catch {
        decoded = {};
      }

      const roles: string[] = decoded?.realm_access?.roles ?? [];
      const role = pickRole(roles);

      const email = (profile as any)?.email ?? decoded?.email ?? null;
      const username =
        (profile as any)?.preferred_username ??
        decoded?.preferred_username ??
        (profile as any)?.username ??
        null;

      const first_name =
        (profile as any)?.given_name ?? decoded?.given_name ?? null;
      const last_name =
        (profile as any)?.family_name ?? decoded?.family_name ?? null;

      await pg.query(
        `INSERT INTO users (id, email, username, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             username = EXCLUDED.username,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             role = EXCLUDED.role`,
        [id, email, username, first_name, last_name, role],
      );

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = account.providerAccountId ?? token.sub;
        token.id_token = account.id_token ?? "";

        let decoded: any = {};
        try {
          decoded = jwtDecode<any>(account.access_token!);
        } catch {
          decoded = {};
        }

        const roles: string[] = decoded?.realm_access?.roles ?? [];
        (token as any).role = pickRole(roles) ?? "client";
        (token as any).username =
          (profile as any).preferred_username ??
          decoded?.preferred_username ??
          (profile as any).username ??
          (token as any).username;
      }
      return token;
    },

    async session({ session, token }) {
      (session.user as any).id = token.sub ?? "";
      (session.user as any).role = (token as any).role ?? "client";
      (session as any).id_token = (token as any).id_token ?? null;
      (session as any).username = (token as any).username ?? null;
      return session;
    },
  },
};
