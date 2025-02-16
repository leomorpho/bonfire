import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

// Load environment variables from .env.production file explicitly
dotenv.config({ path: '.env.prod' });

// Get the command-line arguments
const args = process.argv.slice(2);
const argMap = new Map(
	args
		.map((arg) => arg.split('=')) // Split into key-value pairs
		.filter((pair) => pair.length === 2) as [string, string][] // Ensure only valid [key, value] pairs
);

const isProd = args.includes('--prod');

// Get values from CLI args, falling back to environment variables
const dbUrl =
	(argMap.get('TURSO_DB_URL') as string | undefined) ??
	(isProd ? (process.env.TURSO_DB_URL ?? '') : 'file:local.db');

const authToken =
	(argMap.get('TURSO_DB_AUTH_TOKEN') as string | undefined) ??
	process.env.TURSO_DB_AUTH_TOKEN ??
	'';

// Validate required values
if (!dbUrl) {
	console.error(
		'❌ Error: Database URL not provided.\nUsage: node migrate.js TURSO_DB_URL=<url> [TURSO_DB_AUTH_TOKEN=<token>]'
	);
	process.exit(1);
}

if (!authToken && dbUrl.startsWith('libsql://')) {
	console.error(
		'❌ Error: Auth token is required for remote databases.\nUsage: node migrate.js TURSO_DB_URL=<url> TURSO_DB_AUTH_TOKEN=<token>'
	);
	process.exit(1);
}

// Log the connection details (excluding auth token for security)
console.log(`🔹 Connecting to database at: ${dbUrl}`);

// Create the database client
const dbClient = createClient({
	url: dbUrl,
	authToken: authToken as string
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
