import { db } from './db';
import { thoughtTable, thoughtDistortionTable, beliefRatingTable } from './schema';
import { generateId } from 'lucia';
import { eq, and } from 'drizzle-orm';

export const createThought = async (userId: string, thought: string): Promise<number> => {
	let insertedThought = await db
		.insert(thoughtTable)
		.values({
			userId: userId,
			thought: thought,
			createdAt: new Date()
		})
		.returning({ id: thoughtTable.id });
	return insertedThought[0].id;
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
