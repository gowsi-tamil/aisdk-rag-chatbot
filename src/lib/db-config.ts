import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('NEON_DATABASE_URL is missing');
}

const sql = neon(databaseUrl);

export const db = drizzle(sql);
