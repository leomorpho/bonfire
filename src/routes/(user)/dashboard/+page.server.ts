import { Status } from '$lib/enums.js';
import { createAttendeeId } from '$lib/rsvp';
import { generateSignedUrl } from '$lib/server/filestorage.js';
import { triplitHttpClient } from '$lib/server/triplit.js';
import type { StringColorFormat } from '@faker-js/faker';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	// Select all events created by the current user where they don't have an attendance object,
	// and make sure to create one attendance for each of such events. This is a catch-all to make
	// sure they show up on the dashboard since we list by attendance object.
	const eventQuery = triplitHttpClient
		.query('events')
		.Where('user_id', '=', user.id)
		.SubqueryOne(
			'self_attendance',
			triplitHttpClient.query('attendees').Where('user_id', '=', user.id)
		)
		.Include('attendees'); // TODO: this is repetitive (from the subquery)
	const events = await triplitHttpClient.fetch(eventQuery);

	// Process each event and conditionally insert attendance
	await Promise.all(
		events.map(async (event) => {
			// Check if self_attendance exists
			if (!event.self_attendance || event.self_attendance.length === 0) {
				await triplitHttpClient.insert('attendees', {
					id: createAttendeeId(event.id, user?.id),
					event_id: event.id,
					user_id: user?.id,
					status: Status.GOING
				});
			}
		})
	);

	const banners = await fetchBannersForEvents(user.id);

	return {
		user: user,
		banners: banners
	};
};

// Fetch banner information for a list of events
async function fetchBannersForEvents(userId: string) {
	try {
		// Fetch all banners in a single query using the IN operator
		const banners = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('banner_media')
				.Where(['event.attendees.user_id', '=', userId])
				.Select([
					'event_id',
					// 'full_image_key',
					'small_image_key',
					// 'blurr_hash',
					// 'unsplash_author_name',
					// 'unsplash_author_username'
				])
		);

		// Process each banner to generate signed URLs
		const bannerPromises = banners.map(async (banner) => {
			try {
				// const bannerLargeSizeUrl = await generateSignedUrl(banner.full_image_key);
				const bannerSmallSizeUrl = await generateSignedUrl(banner.small_image_key);

				return {
					eventId: banner.event_id,
					// bannerIsSet: true,
					bannerSmallSizeUrl,
					// bannerLargeSizeUrl,
					// bannerBlurHash: banner.blurr_hash,
					// unsplashAuthorName: banner.unsplash_author_name,
					// unsplashAuthorUsername: banner.unsplash_author_username
				};
			} catch (e) {
				console.error(`Failed to generate signed URLs for event ${banner.event_id}:`, e);
				return {
					eventId: banner.event_id,
					bannerIsSet: false,
					error: 'Failed to generate signed URLs'
				};
			}
		});

		return await Promise.all(bannerPromises);
	} catch (e) {
		console.error('Failed to fetch banners for events:', e);
	}
}
