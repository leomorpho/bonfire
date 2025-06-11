import type { HttpClient, TriplitClient } from '@triplit/client';
import type { WorkerClient } from '@triplit/client/worker-client';

export async function toggleEmojiReaction(
	client: TriplitClient | WorkerClient | HttpClient,
	userId: string,
	eventId: string,
	entityId: string,
	entityType: string,
	emoji: string,
	singleReactionPerEntity: boolean = false // Optional param
): Promise<void> {
	console.log('🔍 Emoji Reaction Debugging:', {
		userId,
		eventId,
		entityId,
		entityType,
		emoji,
		singleReactionPerEntity
	});

	// Fetch existing reactions by the user for this entity
	const existingReactions = await client.fetch(
		client
			.query('emoji_reactions')
			.Where([
				['user_id', '=', userId],
				['entity_id', '=', entityId],
				['entity_type', '=', entityType]
			])
			.Select(['id', 'emoji'])
	);

	// If single reaction per entity is enforced, remove all previous reactions
	if (singleReactionPerEntity) {
		for (const reaction of existingReactions) {
			await client.delete('emoji_reactions', reaction.id);
		}

		// If the existing reaction was the same, don't re-add it
		if (existingReactions.some((r) => r.emoji === emoji)) {
			return;
		}
	}

	// Check if the exact reaction already exists (for normal toggling)
	const existingReaction = existingReactions.find((r) => r.emoji === emoji);

	if (existingReaction) {
		// If the reaction exists, remove it
		await client.delete('emoji_reactions', existingReaction.id);
	} else {
		// Otherwise, add the reaction
		await client.insert('emoji_reactions', {
			emoji: emoji,
			entity_id: entityId,
			entity_type: entityType,
			user_id: userId,
			event_id: eventId
		});
	}
}
