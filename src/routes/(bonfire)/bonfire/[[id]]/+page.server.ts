import { Status, tempAttendeeSecretParam } from '$lib/enums';
import { generateSignedUrl } from '$lib/filestorage.js';
import { triplitHttpClient } from '$lib/server/triplit';
import { redirect } from '@sveltejs/kit';
import { and } from '@triplit/client';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async ({ params, locals, url }) => {
	const eventId = params.id; // Get the event ID from the route parameters

	if (!eventId) {
		redirect(302, '/dashboard');
	}

	// Get the user from locals
	const user = locals.user;
	// console.log('logged in user', user);
	let event = null;
	let numAttendingGoing = 0;
	let numAnnouncements = 0;
	let numFiles = 0;

	let bannerIsSet = false;
	let bannerSmallSizeUrl = null;
	let bannerLargeSizeUrl = null;
	let bannerBlurHash = '';
	let numBringListItems = 0;

	let tempAttendeeId;
	const tempAttendeeSecretStr = url.searchParams.get(tempAttendeeSecretParam);
	if (tempAttendeeSecretStr) {
		try {
			const existingAttendee = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('temporary_attendees')
					.Where(['secret_mapping.id', '=', tempAttendeeSecretStr])
			);
			if (existingAttendee) {
				tempAttendeeId = existingAttendee.id;
			}
		} catch (e) {
			console.debug('failed to find temp attendee because it does not exist', e);
		}
	}

	if (user) {
		try {
			// TODO: probably rate limit the number of new events you can see per minute

			// Add viewer object so user is in the event viewer list else
			// they won't be able to query for that event in FE
			await triplitHttpClient.insert('event_viewers', {
				id: `${eventId}-${user.id}`,
				event_id: eventId,
				user_id: user.id
			});
		} catch (e) {
			console.log(e);
		}
	}

	let isUserAnAttendee = false;

	try {
		event = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('events')
				.Where(and([['id', '=', eventId as string]]))
				.Include('announcements_list', (rel) => rel('announcements').Select(['id']))
				.Include('attendees')
				.Include('temporary_attendees')
				.Include('files_list', (rel) => rel('files').Select(['id']))
				.Include('banner_media')
				.Include('event_admins')
				.Include('bring_items_list', (rel) => rel('bring_items').Select(['id']))
				.SubqueryOne(
					'organizer',
					triplitHttpClient
						.query('user')
						.Where(['id', '=', '$1.user_id'])
						.Select(['username', 'id'])
				)
		);
	} catch (e) {
		console.debug(`failed to fetch event with id ${eventId}`, e);
	}
	if (event != null) {
		if (!event.is_published) {
			// Only admins or event owner can see unpublished event
			if (!user) {
				redirect(303, '/bonfire/not-yet-published');
			}
			const adminUserIds = new Set(
				event.event_admins.map((admin: { user_id: string }) => admin.user_id)
			);
			const currUserIsAdmin = user.id === event.user_id || adminUserIds.has(user.id);
			if (!currUserIsAdmin) {
				redirect(303, '/bonfire/not-yet-published');
			}
		}

		if (event.attendees != null) {
			// Count only attendees with status "GOING" and include guest count
			numAttendingGoing += event.attendees.reduce(
				(total, attendee) =>
					attendee.status === Status.GOING ? total + (attendee.guest_count || 0) + 1 : total,
				0
			);

			// Check if the current user is among the attendees
			isUserAnAttendee = event.attendees.some((attendee) => attendee.user_id === user?.id);
		}
		if (event.temporary_attendees != null) {
			// Count only temporary attendees with status "GOING" and include guest count
			numAttendingGoing += event.temporary_attendees.reduce(
				(total, attendee) =>
					attendee.status === Status.GOING ? total + (attendee.guest_count || 0) + 1 : total,
				0
			);

			if (!isUserAnAttendee) {
				isUserAnAttendee = event.temporary_attendees.some(
					(attendee) => attendee.user_id === user?.id
				);
			}
		}
		if (event.announcements_list != null) {
			numAnnouncements = event.announcements_list.length;
		}
		if (event.files_list != null) {
			numFiles = event.files_list.length;
		}
		if (event.banner_media) {
			bannerIsSet = true;
			const image = event.banner_media;
			bannerLargeSizeUrl = await generateSignedUrl(image.full_image_key);
			bannerSmallSizeUrl = await generateSignedUrl(image.small_image_key);
			bannerBlurHash = image.blurr_hash;
		}

		if (event.bring_items_list) {
			numBringListItems = event.bring_items_list.length;
		}

		// console.log("numAnnouncements", numAnnouncements)
		// console.log("numFiles", numFiles)
	}

	const bannerInfo = {
		bannerIsSet,
		bannerSmallSizeUrl,
		bannerLargeSizeUrl,
		bannerBlurHash
	};
	return {
		user,
		event,
		numBringListItems,
		numAttendingGoing,
		numAnnouncements,
		numFiles,
		tempAttendeeId,
		bannerInfo,
		isUserAnAttendee
	};
};
