import { db } from './db';
import {
	thoughtTable,
	thoughtDistortionTable,
	beliefRatingTable,
	beliefTargetRatingTable
} from './schema';
import { generateId } from 'lucia';
import { eq, and, desc } from 'drizzle-orm';
import { CognitiveDistortions } from '$lib/enums';

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

export const setThoughtEmotions = async (
	userId: string,
	thoughtId: number,
	emotions: string[]
): Promise<{ id: number; userId: string; thought: string; createdAt: Date; emotions: string[] }> => {
	// Verify ownership
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	// Update the emotions
	const updatedThought = await db
		.update(thoughtTable)
		.set({ emotions: JSON.stringify(emotions) }) // Convert emotions array to JSON string
		.where(eq(thoughtTable.id, thoughtId))
		.returning();

	return {
		...updatedThought[0],
		emotions // Return the updated emotions
	};
};


export const getCognitiveDistortionsForThought = async (
	thoughtId: number,
	userId: string
) => {
	// Verify that the thought belongs to the user before fetching distortions
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	// Retrieve distortions and their ratings for the given thoughtId
	const distortions = await db
		.select({
			cognitiveDistortion: thoughtDistortionTable.cognitiveDistortion,
			rating: thoughtDistortionTable.rating,
			source: thoughtDistortionTable.source
		})
		.from(thoughtDistortionTable)
		.where(eq(thoughtDistortionTable.thoughtId, thoughtId));

	return distortions;
};

export const linkCognitiveDistortion = async (
	thoughtId: number,
	cognitiveDistortion: string,
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
		cognitiveDistortion,
		rating, // Rating of how much the distortion applies (0-100)
		source
	});
};

export const linkCognitiveDistortionsBulk = async (
	thoughtId: number,
	distortions: {
		distortion: keyof typeof CognitiveDistortions;
		rating: number;
		source: 'user' | 'ai';
	}[],
	userId: string
) => {
	// Ensure the thought belongs to the user
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	for (const distortion of distortions) {
		const cognitiveDistortionValue = CognitiveDistortions[distortion.distortion];

		// Check if a record already exists
		const existingDistortion = await db
			.select()
			.from(thoughtDistortionTable)
			.where(
				and(
					eq(thoughtDistortionTable.thoughtId, thoughtId),
					eq(thoughtDistortionTable.cognitiveDistortion, cognitiveDistortionValue)
				)
			);

		if (existingDistortion.length > 0) {
			// Update the existing record's rating
			await db
				.update(thoughtDistortionTable)
				.set({ rating: distortion.rating, source: distortion.source }) // Ensure the source is also updated if needed
				.where(
					and(
						eq(thoughtDistortionTable.thoughtId, thoughtId),
						eq(thoughtDistortionTable.cognitiveDistortion, cognitiveDistortionValue)
					)
				);
		} else {
			// Insert a new record
			await db.insert(thoughtDistortionTable).values({
				thoughtId,
				cognitiveDistortion: cognitiveDistortionValue,
				rating: distortion.rating,
				source: distortion.source
			});
		}
	}
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

// Get belief rating for a thought
export const getBeliefInThought = async (thoughtId: number, userId: string) => {
	// Verify thought ownership
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	// Retrieve the belief rating
	const beliefRating = await db
		.select()
		.from(beliefRatingTable)
		.where(eq(beliefRatingTable.thoughtId, thoughtId))
		.orderBy(desc(beliefRatingTable.ratedAt))
		.limit(1); // Get the latest rating if multiple entries exist

	return beliefRating.length > 0 ? beliefRating[0] : null;
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

// Get belief target rating for a thought
export const getBeliefTargetRating = async (thoughtId: number, userId: string) => {
	// Verify thought ownership
	const thoughtExists = await db
		.select()
		.from(thoughtTable)
		.where(and(eq(thoughtTable.id, thoughtId), eq(thoughtTable.userId, userId)));

	if (thoughtExists.length === 0) {
		throw new Error('Unauthorized: User does not own the thought');
	}

	// Retrieve the belief target rating
	const beliefTargetRating = await db
		.select()
		.from(beliefTargetRatingTable)
		.where(eq(beliefTargetRatingTable.thoughtId, thoughtId))
		.orderBy(desc(beliefTargetRatingTable.ratedAt))
		.limit(1); // Get the latest rating if multiple entries exist

	return beliefTargetRating.length > 0 ? beliefTargetRating[0] : null;
};
