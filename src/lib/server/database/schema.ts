import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const userTable = sqliteTable('user', {
	id: text('id').notNull().primaryKey(),
	email: text('email').notNull(),
	email_verified: integer('email_verified', { mode: 'boolean' })
});

export const sessionTable = sqliteTable('session', {
	id: text('id').notNull().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer('expires_at').notNull()
});

export const emailVerificationTokenTable = sqliteTable('email_verification_token', {
	id: text('id').notNull().primaryKey(),
	user_id: text('user_id').notNull(),
	email: text('email').notNull(),
	expires_at: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const signinTable = sqliteTable('signin', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	logged_in_at: integer('logged_in_at', { mode: 'timestamp' }).notNull(),
	ip_address: text('ip_address').notNull(),
	email: text('email').notNull()
});

export const thoughtTable = sqliteTable('thought', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => userTable.id),
	thought: text('thought').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const cognitiveDistortionTable = sqliteTable('cognitive_distortion', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull() // e.g., Overgeneralization, Catastrophizing, etc.
});

export const thoughtDistortionTable = sqliteTable('thought_distortion', {
	thoughtId: integer('thought_id')
		.notNull()
		.references(() => thoughtTable.id),
	cognitiveDistortionId: integer('cognitive_distortion_id')
		.notNull()
		.references(() => cognitiveDistortionTable.id),
	// Rating (0-100) of how much this distortion applies to the thought
	rating: integer('rating').notNull(),
	// 'user' or 'ai' as the source of the rating
	source: text('source').notNull()
});

export const beliefRatingTable = sqliteTable('belief_rating', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	thoughtId: integer('thought_id')
		.notNull()
		.references(() => thoughtTable.id),
	// Rating (0-100) of how much the user believes the thought
	beliefRating: integer('belief_rating').notNull(),
	ratedAt: integer('rated_at', { mode: 'timestamp' }).notNull()
});
