import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

export const runDrizzleMigrations = async (dbUrl: string, authToken: string) => {
	// Log the connection details (excluding auth token for security)
	console.log(`🔹 Connecting to database at: ${dbUrl}`);

	// Create the database client
	const dbClient = createClient({
		url: dbUrl,
		authToken: authToken
	});

	// Create the drizzle client
	const drizzleClient = drizzle(dbClient);

	// Run the migration
	migrate(drizzleClient, {
		migrationsFolder: './drizzle'
	})
		.then(() => {
			console.log('✅ Migrations completed successfully.');
			process.exit(0);
		})
		.catch((err) => {
			console.error('❌ Migration failed:', err);
			throw err;
		});
};
