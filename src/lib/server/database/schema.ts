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

// NOTE: deprecating
export const emailVerificationTokenTable = sqliteTable('email_verification_token', {
	id: text('id').notNull().primaryKey(),
	created_at: text('timestamp')
		.notNull()
		.default(sql`(current_timestamp)`),
	user_id: text('user_id').notNull(),
	email: text('email').notNull(),
	expires_at: integer('expires_at', { mode: 'timestamp' }).notNull()
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

export const taskLockTable = sqliteTable('task_locks', {
	task_name: text('task_name').notNull().primaryKey(),
	locked: integer('locked', { mode: 'boolean' }).notNull().default(false),
	updated_at: text('timestamp')
		.notNull()
		.default(sql`(current_timestamp)`)
});

export const eventTransactionLogsTable = sqliteTable('eventTransactionLogs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	created_at: text('timestamp')
		.notNull()
		.default(sql`(current_timestamp)`),
	num_logs_change: integer('num_logs_change').notNull()
});

export const pushSubscriptionTable = sqliteTable('push_subscription', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	endpoint: text('endpoint').notNull(),
	p256dh: text('p256dh').notNull(),
	auth: text('auth').notNull(),
	created_at: text('timestamp')
		.notNull()
		.default(sql`(current_timestamp)`)
});

export const notificationPermissionTable = sqliteTable('notification_permission', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => userTable.id),
	oneDayReminder: integer('one_day_reminder', { mode: 'boolean' }).notNull().default(false),
	eventActivity: integer('event_activity', { mode: 'boolean' }).notNull().default(false),
	created_at: text('timestamp')
		.notNull()
		.default(sql`(current_timestamp)`),
	updated_at: text('timestamp')
		.notNull()
		.default(sql`(current_timestamp)`)
});

export const deletedUserTable = sqliteTable('deleted_user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').notNull(),
	deleted_at: text('deleted_at')
		.notNull()
		.default(sql`(current_timestamp)`)
});
