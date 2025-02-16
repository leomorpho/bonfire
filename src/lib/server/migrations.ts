import { env as privateEnv } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { runDrizzleMigrations } from '$lib/cli_drizzle_migrations';
import { pushTriplitSchema } from './triplit';

/**
 * Run migrations and schema push **without blocking event loop**
 */
export async function initializeDatabaseSchemas() {
	try {
		console.log('🔄 Running Drizzle migrations before app starts...');
		await runDrizzleMigrationsWithDefaultParams();
		console.log('✅ Drizzle migrations complete.');

		// console.log('🔄 Pushing Triplit schema before app starts...');
		// await pushTriplitSchema();
		// console.log('✅ Triplit schema push complete.');
	} catch (error) {
		console.error('❌ Migration or schema push failed:', error);
		process.exit(1); // 🚨 Stop the app if migrations fail
	}
}

export const runDrizzleMigrationsWithDefaultParams = async () => {
	const url = dev ? 'file:local.db' : privateEnv.TURSO_DB_URL;
	const authToken = privateEnv.TURSO_DB_AUTH_TOKEN;

	await runDrizzleMigrations(url, authToken);
};
