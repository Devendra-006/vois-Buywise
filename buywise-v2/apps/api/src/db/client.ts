import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";
import { env } from "../config/env.js";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let queryClient: ReturnType<typeof postgres> | null = null;

if (env.DATABASE_URL) {
  try {
    queryClient = postgres(env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    });
    dbInstance = drizzle(queryClient, { schema });
    console.log("🐘 Connected to PostgreSQL via Drizzle ORM");
  } catch (err: any) {
    console.error("❌ Failed to connect to PostgreSQL:", err.message);
    if (env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
} else {
  if (env.NODE_ENV === "production") {
    console.error("❌ Production FATAL: DATABASE_URL is not defined.");
    process.exit(1);
  } else {
    console.warn("⚠️ DATABASE_URL not set. Running in local demo mode without PostgreSQL connection.");
  }
}

export const db = dbInstance;
export const sql = queryClient;
