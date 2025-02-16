import * as dotenv from 'dotenv';
import { runDrizzleMigrations } from '$lib/cli_drizzle_migrations';

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

runDrizzleMigrations(dbUrl, authToken);
