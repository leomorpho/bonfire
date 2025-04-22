import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const userTable = sqliteTable('user', {
	id: text('id').notNull().primaryKey(),
	created_at: text('timestamp')
		.notNull()
		.default(sql`(current_timestamp)`),
	email: text('email').notNull().unique(),
	email_verified: integer('email_verified', { mode: 'boolean' }),
	num_logs: integer('num_logs').default(3),
	is_event_styles_admin: integer('is_event_styles_admin', { mode: 'boolean' }).default(false)
});

export const sessionTable = sqliteTable('session', {
	id: text('id').notNull().primaryKey(),
	created_at: text('timestamp')
		.notNull()
		.default(sql`(current_timestamp)`),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer('expires_at').notNull()
});

export const emailVerificationOtpTable = sqliteTable('email_verification_otp', {
	id: text('id').notNull().primaryKey(),
	user_id: text('user_id').notNull(),
	email: text('email').notNull(),
	otp: text('otp').notNull(),
	created_at: text('timestamp')
		.notNull()
		.default(sql`(current_timestamp)`),
	expires_at: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const signinTable = sqliteTable('signin', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	logged_in_at: integer('logged_in_at', { mode: 'timestamp' }).notNull(),
	ip_address: text('ip_address').notNull(),
	email: text('email').notNull()
});
