# licenseMe

licenseMe is a Next.js application for managing software project listings and issuing signed license keys. Developers can submit projects for review, clients can browse approved projects and generate licenses, and admins can review both developer registration requests and project listing requests.

The generated license keys are RS256-signed JWTs that include the license owner, project identity, selected feature keys, status, and issue timestamp.

## Features

- Keycloak authentication through NextAuth.
- Role-based access for `client`, `developer`, and `admin` users.
- Developer registration request flow with admin approval.
- Developer account creation through approved invitation links.
- Project listing request flow with admin approval or rejection.
- Project rejection feedback shown to developers and sent by email.
- Public project catalogue that only shows approved projects.
- License generation for selected project features.
- License overview with copied JWT keys and feature badges.
- Account, project, and license management screens.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI primitives
- NextAuth v4
- Keycloak
- PostgreSQL
- Nodemailer
- RS256 JWT signing with Node `crypto`

## Project Structure

```txt
app/
  src/app/                  App Router pages and API routes
  src/components/           Reusable UI and feature components
  src/lib/                  Frontend/shared helpers
  lib/                      Server-side integrations
    auth.ts                 NextAuth and Keycloak session mapping
    db.ts                   PostgreSQL pool
    keycloak-admin.ts       Keycloak Admin API helpers
    license-token.ts        License JWT signing helper
    mailer.ts               Transactional email helpers
  types/                    Type declarations
```

The GitHub README lives at the repository root, but the active Next.js app is inside `app/`.

## Main Workflows

### Authentication and Roles

Users authenticate with Keycloak. During sign-in, the app reads realm roles from the Keycloak access token and maps them to one of:

- `client`
- `developer`
- `admin`

The mapped role is stored in the NextAuth JWT/session and synced into the local `users` table.

### Developer Registration

1. A user submits a developer registration request.
2. Admins review requests from `/devrequests`.
3. Approved requests generate an invitation link.
4. The invitation is emailed to the user.
5. The user completes developer account creation through `/complete-dev-registration`.

### Project Listing Approval

1. Developers submit projects from `/addnewproject`.
2. New projects are saved as `pending`.
3. Admins review project listing requests from `/projectrequests`.
4. Approved projects become visible in `/listofprojects`.
5. Rejected projects remain visible in `/myprojects` with a rejection status.
6. Developers can open `/verifyproject` to see the rejection reason.
7. Approval and rejection results are sent by email.

### License Generation

Clients open an approved project, choose the desired features, and generate a license. The license is stored in PostgreSQL and returned as an RS256 JWT containing the selected `feature_keys`.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL
- Keycloak realm with the expected roles: `client`, `developer`, `admin`
- SMTP credentials for transactional emails
- RSA private key for license signing

### Install Dependencies

```bash
cd app
pnpm install
```

### Environment Variables

Create `app/.env.local` and provide the required values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/licence_server"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-secret"
APP_URL="http://localhost:3000"

KEYCLOAK_ISSUER="http://localhost:8080/realms/your-realm"
KEYCLOAK_CLIENT_ID="your-nextauth-client"
KEYCLOAK_CLIENT_SECRET="your-nextauth-client-secret"
NEXT_PUBLIC_KEYCLOAK_ISSUER="http://localhost:8080/realms/your-realm"

KEYCLOAK_ADMIN_CLIENT_ID="your-admin-client"
KEYCLOAK_ADMIN_CLIENT_SECRET="your-admin-client-secret"

SMTP_HOST="smtp.example.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="user@example.com"
SMTP_PASS="smtp-password"
MAIL_FROM="licenseMe <user@example.com>"

LICENSE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
LICENSE_TOKEN_ISSUER="licenta-platform"
```

Some account deletion code also expects Keycloak admin-user style variables:

```env
KEYCLOAK_BASE="http://localhost:8080"
KEYCLOAK_REALM="your-realm"
KEYCLOAK_ADMIN="admin"
KEYCLOAK_ADMIN_PASSWORD="admin-password"
```

Do not commit `.env.local`, private keys, database dumps, or PEM files.

### Database

The app expects PostgreSQL tables for:

- `users`
- `projects`
- `features`
- `licenses`
- `license_features`
- `dev_requests`
- `dev_invitations`

Project approval requires these columns on `projects`:

```sql
status varchar(50) DEFAULT 'pending' NOT NULL,
review_reason text,
reviewed_at timestamp with time zone,
reviewed_by_admin_id text,
submitted_at timestamp with time zone DEFAULT now()
```

Existing projects should normally be backfilled as `approved` before enabling the approval flow.

## Development

Run the development server:

```bash
cd app
pnpm dev
```

Open:

```txt
http://localhost:3000
```

Run a production build:

```bash
cd app
pnpm build
```

Run TypeScript checks:

```bash
cd app
pnpm exec tsc --noEmit -p tsconfig.json
```

## Important Routes

### Public and Auth

- `/login`
- `/devregister`
- `/verifyrequest`
- `/complete-dev-registration`
- `/forbidden`

### Client and Developer

- `/listofprojects`
- `/projects/[slug]`
- `/mylicenses`
- `/myprojects`
- `/verifyproject`
- `/addnewproject`

### Admin

- `/devrequests`
- `/devrequests/[id]`
- `/projectrequests`
- `/projectrequests/[id]`

## License JWT Payload

A generated license token contains a payload similar to:

```json
{
  "iss": "licenta-platform",
  "sub": "license:123",
  "owner_id": "keycloak-user-id",
  "project_id": 42,
  "feature_keys": ["export-csv", "advanced-reporting"],
  "status": "active",
  "iat": 1710000000
}
```

Only selected feature keys should be included in the license payload.

## Notes

- Only approved projects are shown in the public project catalogue.
- Project and developer approval flows are admin-only.
- The navbar includes pending request badges for admin users.
- The app uses local storage only for UI session-duration display, not for authentication.
- SMTP failures are reported as warnings after the database update succeeds.
