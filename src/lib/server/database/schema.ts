import { boolean } from 'drizzle-orm/mysql-core';
import { sqliteTable, text, integer, primaryKey, unique } from 'drizzle-orm/sqlite-core';

export const userTable = sqliteTable('user', {
	id: text('id').notNull().primaryKey(),
	email: text('email').notNull(),
	email_verified: integer('email_verified', { mode: 'boolean' }),
	encryption_backup_up: integer('encryption_backup_up', { mode: 'boolean' })
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
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	thought: text('thought').notNull(),
	emotions: text('emotions').default('[]'), // Store emotions as a JSON string
	areDistortionsDone: integer('are_distortions_done', { mode: 'boolean' }),
	areEmotionsIdentified: integer('are_emotions_identified', { mode: 'boolean' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const thoughtDistortionTable = sqliteTable(
	'thought_distortion',
	{
		thoughtId: integer('thought_id')
			.notNull()
			.references(() => thoughtTable.id),
		cognitiveDistortion: text('cognitive_distortion').notNull(),
		rating: integer('rating').notNull(),
		details: text('details'),
		source: text('source').notNull()

		// Enforce unique constraint on thoughtId and cognitiveDistortion combination
	},
	(table) => ({
		uniqueThoughtDistortion: unique().on(table.thoughtId, table.cognitiveDistortion, table.source)
	})
);

export const beliefRatingTable = sqliteTable('belief_rating', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	thoughtId: integer('thought_id')
		.notNull()
		.references(() => thoughtTable.id),
	// Rating (0-100) of how much the user believes the thought
	beliefRating: integer('belief_rating').notNull(),
	ratedAt: integer('rated_at', { mode: 'timestamp' }).notNull()
});

export const beliefTargetRatingTable = sqliteTable('belief_target_rating', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	thoughtId: integer('thought_id')
		.notNull()
		.references(() => thoughtTable.id)
		.unique(), // Ensure at most one entry per thoughtId
	// Rating (0-100) of how much the user believes the thought
	beliefTargetRating: integer('belief_target_rating').notNull(),
	ratedAt: integer('rated_at', { mode: 'timestamp' }).notNull()
});
