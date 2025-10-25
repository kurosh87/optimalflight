/**
 * Database Connection
 * Using Drizzle ORM with Neon PostgreSQL
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Create the database connection
const sql = neon(process.env.DATABASE_URL!);

// Export the drizzle instance
export const db = drizzle(sql, { schema });

// Export schema for convenient access
export * from './schema';
