import { db } from './db';
import {
	thoughtTable,
	thoughtDistortionTable,
	beliefRatingTable,
	beliefTargetRatingTable
} from './schema';
import { generateId } from 'lucia';
import { eq, and, desc } from 'drizzle-orm';

export const listThoughts = async (userId: string) => {
	// Fetch all thoughts for the user, ordered by creation date
	const thoughts = await db
		.select()
		.from(thoughtTable)
		.where(eq(thoughtTable.userId, userId))
		.orderBy(desc(thoughtTable.createdAt)); // Order by most recent
	return thoughts;
};

// Get a single thought by ID
export const getThoughtById = async (thoughtId: number, userId: string) => {
	// Fetch the thought and verify ownership
	const thought = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)))
		.limit(1); // Limit to one result

	if (thought.length === 0) {
		throw new Error('Thought not found or unauthorized access');
	}

	return thought[0]; // Return the thought object
};

export const createThought = async (
	userId: string,
	thought: string
): Promise<{ id: number; userId: string; thought: string; createdAt: Date }> => {
	const insertedThought = await db
		.insert(thoughtTable)
		.values({
			userId: userId,
			thought: thought,
			createdAt: new Date()
		})
		.returning(); // Returns all fields by default

	return insertedThought[0];
};

export const updateThought = async (
	userId: string,
	thoughtId: number,
	newThought: string
): Promise<{ id: number; userId: string; thought: string; createdAt: Date }> => {
	// Verify ownership
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	// Update the thought
	const updatedThought = await db
		.update(thoughtTable)
		.set({ thought: newThought })
		.where(eq(thoughtTable.id, thoughtId))
		.returning();

	return updatedThought[0];
};

export const deleteThought = async (userId: string, thoughtId: number) => {
	// Verify that the thought belongs to the user before deleting
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	// Delete the thought
	await db.delete(thoughtTable).where(eq(thoughtTable.id, thoughtId));
};

export const linkCognitiveDistortion = async (
	thoughtId: number,
	cognitiveDistortionId: number,
	rating: number,
	source: 'user' | 'ai',
	userId: string
) => {
	// Verify that the thought belongs to the user before inserting
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	const id = generateId(40);
	await db.insert(thoughtDistortionTable).values({
		thoughtId,
		cognitiveDistortionId,
		rating, // Rating of how much the distortion applies (0-100)
		source
	});
};

export const setBeliefInThought = async (
	thoughtId: number,
	beliefRating: number,
	userId: string
) => {
	// Verify that the thought belongs to the user before inserting
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	await db.insert(beliefRatingTable).values({
		thoughtId,
		beliefRating: beliefRating, // User's belief in the thought (0-100)
		ratedAt: new Date() // Timestamp for tracking belief changes
	});
};

export const upsertBeliefTargetRating = async (
	thoughtId: number,
	beliefTargetRating: number,
	userId: string
) => {
	// Verify that the thought belongs to the user before inserting/updating
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	const existing = await db
		.select()
		.from(beliefTargetRatingTable)
		.where(eq(beliefTargetRatingTable.thoughtId, thoughtId));

	if (existing.length > 0) {
		// Update existing record
		await db
			.update(beliefTargetRatingTable)
			.set({ beliefTargetRating, ratedAt: new Date() })
			.where(eq(beliefTargetRatingTable.thoughtId, thoughtId));
	} else {
		// Insert new record
		await db.insert(beliefTargetRatingTable).values({
			thoughtId,
			beliefTargetRating,
			ratedAt: new Date()
		});
	}
};
