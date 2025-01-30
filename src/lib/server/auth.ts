import { db } from './database/db';
import { Google } from 'arctic';
import { Lucia, TimeSpan } from 'lucia';

import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { dev } from '$app/environment';
import { sessionTable, userTable } from './database/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			emailVerified: attributes.email_verified,
			email: attributes.email,
			num_logs: attributes.num_logs,
			is_event_styles_admin: attributes.is_event_styles_admin
		};
	},
	sessionExpiresIn: new TimeSpan(90, 'd') // 90 days
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			email: string;
			email_verified: boolean;
			num_logs: number;
			is_event_styles_admin: boolean;
		};
	}
}

const redirect_url = dev
	? 'http://localhost:5173/login/google/callback'
	: `${publicEnv.PUBLIC_ORIGIN}/login/google/callback`;

export const google = new Google(
	privateEnv.GOOGLE_CLIENT_ID,
	privateEnv.GOOGLE_CLIENT_SECRET,
	redirect_url
);

// if (!dev && (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)) {
// 	throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set');
// }
