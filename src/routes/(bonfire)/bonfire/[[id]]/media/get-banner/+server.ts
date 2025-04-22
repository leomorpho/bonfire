import { json, error } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { generateSignedUrl } from '$lib/server/filestorage';
import { tempAttendeeSecretParam } from '$lib/enums';
import { and } from '@triplit/client';

/**
 * Fetches the banner information for a given event ID,
 * ensuring that the requesting user is an attendee.
 */
export const GET = async ({ params, locals, url }) => {
	const eventId = params.id;
	if (!eventId) {
		throw error(400, 'Event ID is required');
	}

	// Get the logged-in user
	const user = locals.user;
	let tempAttendeeId = null;

	// Handle temporary attendee authentication
	const tempAttendeeSecretStr = url.searchParams.get(tempAttendeeSecretParam);
	if (tempAttendeeSecretStr) {
		try {
			const existingAttendee = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('temporary_attendees')
					.Where(['secret_mapping.id', '=', tempAttendeeSecretStr])
					.Select(['id'])
					
			);
			if (existingAttendee) {
				tempAttendeeId = existingAttendee.id;
			}
		} catch (e) {
			console.debug('Temporary attendee not found', e);
		}
	}

	// Ensure the user is an attendee
	const isUserAttendee = await checkUserIsAttendee(eventId, user?.id, tempAttendeeId);
	if (!isUserAttendee) {
		throw error(403, 'You are not an attendee of this event');
	}

	// Fetch banner information
	try {
		const banner = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('banner_media')
				.Where(['event_id', '=', eventId])
				.Select(['full_image_key', 'small_image_key', 'blurr_hash'])
				
		);

		if (!banner) {
			throw error(404, 'No banner found for this event');
		}

		// Generate signed URLs for the images
		const bannerLargeSizeUrl = await generateSignedUrl(banner.full_image_key);
		const bannerSmallSizeUrl = await generateSignedUrl(banner.small_image_key);

		return json({
			bannerIsSet: true,
			bannerSmallSizeUrl,
			bannerLargeSizeUrl,
			bannerBlurHash: banner.blurr_hash
		});
	} catch (e) {
		console.error(`Failed to fetch banner for event ${eventId}:`, e);
		throw error(500, 'Internal server error');
	}
};

/**
 * Checks if a user (or temporary attendee) is an attendee of the given event.
 */
async function checkUserIsAttendee(
	eventId: string,
	userId: string | null,
	tempAttendeeId: string | null
) {
	try {
		// Check both regular and temporary attendees
		const attendee = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('attendees')
				.Where([
					and([
						['event_id', '=', eventId],
						['user_id', '=', userId]
					])
				])

				.Select(['id'])
				
		);

		if (attendee) {
			return true;
		}

		const tempAttendee = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('temporary_attendees')
				.Where([
					and([
						['event_id', '=', eventId],
						['id', '=', tempAttendeeId]
					])
				])

				.Select(['id'])
				
		);

		return tempAttendee !== null;
	} catch (e) {
		console.error('Failed to check attendee status:', e);
		return false;
	}
}
