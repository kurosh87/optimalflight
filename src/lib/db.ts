import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

// Export sql function for routes that use raw SQL queries
export const sql = neon(process.env.DATABASE_URL!);

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!cachedDb) {
    const sql = neon(process.env.DATABASE_URL);
    cachedDb = drizzle(sql, { schema });
  }

  return cachedDb;
}

// Export db instance for convenience (lazy initialization)
let _db: ReturnType<typeof drizzle> | null = null;
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!_db) {
      _db = getDb();
    }
    return (_db as any)[prop];
  }
});
