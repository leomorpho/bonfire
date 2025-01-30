import { drizzle } from 'drizzle-orm/libsql';
import { dev } from '$app/environment';
import { createClient } from '@libsql/client';
import { env as privateEnv } from '$env/dynamic/private';
import * as schema from '$lib/server/database/schema';

function createDatabaseConnection() {
	// 🔹 Only fetch env vars at runtime
	const url = dev ? 'file:local.db' : privateEnv.TURSO_DB_URL;
	const authToken = privateEnv.TURSO_DB_AUTH_TOKEN;

	if (!url) throw new Error('TURSO_DB_URL is not set');
	if (!dev && !authToken) throw new Error('TURSO_DB_AUTH_TOKEN is not set');

	const libsql = createClient({ url, authToken });
	return drizzle(libsql, { schema });
}

export const db = createDatabaseConnection();
