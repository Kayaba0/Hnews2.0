import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import "dotenv/config"; 

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
