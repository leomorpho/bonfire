import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '$lib/server/database/schema';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

const connectionString = env.SECRET_SUPABASE_URL ?? '';


// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
