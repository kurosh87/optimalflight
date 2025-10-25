/**
 * Database Connection
 * Using Drizzle ORM with Neon PostgreSQL
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';
import ws from 'ws';

// Configure Neon for WebSockets (needed for some environments)
neonConfig.webSocketConstructor = ws;

// Create connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Export the drizzle instance
export const db = drizzle(pool, { schema });

// Export schema for convenient access
export * from './schema';
