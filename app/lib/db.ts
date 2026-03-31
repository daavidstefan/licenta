// initializeaza conexiunea la baza de date postgres

import { Pool } from "pg";

const globalForPg = global as unknown as { pgPool?: Pool };

export const pg =
  globalForPg.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (!globalForPg.pgPool) {
  globalForPg.pgPool = pg;
}
