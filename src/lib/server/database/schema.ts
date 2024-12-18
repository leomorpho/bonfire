import { pgTable, text, integer, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

export const userTable = pgTable('user', {
	id: text('id').notNull().primaryKey(),
	created_at: timestamp('created_at').notNull().defaultNow(),
	email: text('email').notNull().unique(),
	email_verified: boolean('email_verified'),
	num_logs: integer('num_logs').default(3)
});

export const sessionTable = pgTable('session', {
	id: text('id').notNull().primaryKey(),
	created_at: timestamp('timestamp').notNull().defaultNow(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer('expires_at').notNull()
});

export const emailVerificationTokenTable = pgTable('email_verification_token', {
	id: text('id').notNull().primaryKey(),
	created_at: timestamp('timestamp').notNull().defaultNow(),
	user_id: text('user_id').notNull(),
	email: text('email').notNull(),
	expires_at: timestamp('expires_at').notNull()
});

export const signinTable = pgTable('signin', {
	id: serial().primaryKey(),
	logged_in_at: timestamp('logged_in_at').notNull(),
	ip_address: text('ip_address').notNull(),
	email: text('email').notNull()
});

// export const eventTransactionLogsTable = pgTable('eventTransactionLogs', {
// 	id: serial().primaryKey(),
// 	created_at: text('timestamp')
// 		.notNull()
// 		.default(sql`(current_timestamp)`),
// 	num_logs_change: integer('num_logs_change').notNull()
// });

// export const publicEventsTable = pgTable('public_events', {
// 	id: text('id').notNull().primaryKey(),
// 	created_by_user_id: text('created_by_user_id')
// 		.notNull()
// 		.references(() => userTable.id),
// 	status: text('status').notNull().default('active'), // 'active', 'cancelled'
// 	event_name: text('event_name').notNull(),
// 	description: text('description'),
// 	start_time: text('start_time').notNull(),
// 	end_time: text('end_time'),
// 	style: text('style'),
// 	overlay_color: text('overlay_color'),
// 	overlay_opacity: integer('overlay_opacity'),
// 	num_attendees: integer('num_attendees').default(0)
// });

// export const eventDiffsTable = pgTable('event_diffs', {
// 	id: serial().primaryKey(),
// 	created_at: timestamp('timestamp').notNull().defaultNow(),
// 	event_id: integer('event_id')
// 		.notNull()
// 		.references(() => publicEventsTable.id),
// 	user_id: text('user_id')
// 		.notNull()
// 		.references(() => userTable.id),
// 	diff_data: text('diff_data').notNull() // Stores JSON diff as text
// });
