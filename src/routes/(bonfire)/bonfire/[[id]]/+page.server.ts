import { Status, tempAttendeeSecretParam } from '$lib/enums';
import { generateSignedUrl } from '$lib/server/filestorage.js';
import {
	normalizeAttendeeCounts,
	upsertEventsPrivateData,
	wasUserPreviouslyDeleted
} from '$lib/rsvp.js';
import { triplitHttpClient } from '$lib/server/triplit';
import { createRemindersObjects } from '$lib/triplit.js';
import { redirect } from '@sveltejs/kit';
import { and } from '@triplit/client';
import { Client } from '@googlemaps/google-maps-services-js';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async ({ params, locals, url }) => {
	const eventId = params.id; // Get the event ID from the route parameters

	if (!eventId) {
		redirect(302, '/dashboard');
	}

	// Get the user from locals
	const user = locals.user;

	// If this user was previously deleted from this event, block them from
	// accessing again by pretending it is not published.
	if (await wasUserPreviouslyDeleted(triplitHttpClient, user?.id, eventId)) {
		redirect(303, '/bonfire/not-yet-published');
	}

	// console.log('logged in user', user);
	let event = null;
	let numAttendingGoing = 0;
	let numAnnouncements = 0;
	let numFiles = 0;

	let bannerIsSet = false;
	let bannerSmallSizeUrl = null;
	let bannerLargeSizeUrl = null;
	let bannerBlurHash = '';
	let unsplashAuthorUsername = '';
	let unsplashAuthorName = '';

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

	let isUserAnAttendee = false;
	try {
		event = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('events')
				.Where(and([['id', '=', eventId as string]]))
				.Include('private_data')
				.Include('announcements_list', (rel) => rel('announcements').Select(['id']))
				.Include('files_list', (rel) => rel('files').Select(['id']))
				.Include('banner_media')
				.Include('event_admins')
				.Include('bring_items_list', (rel) => rel('bring_items').Select(['id']))
				.Include('event_reminders', (rel) => rel('event_reminders').Select(['id']))
				.SubqueryOne(
					'organizer',
					triplitHttpClient
						.query('user')
						.Where(['id', '=', '$1.user_id'])
						.Select(['username', 'id'])
				)
				.SubqueryOne(
					'current_attendee',
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
			unsplashAuthorName = event.banner_media.unsplash_author_name ?? '';
			unsplashAuthorUsername = event.banner_media.unsplash_author_username ?? '';
			bannerBlurHash = image.blurr_hash;
		}

		if (event.bring_items_list) {
			numBringListItems = event.bring_items_list.length;
		}

		if (event.event_reminders.length == 0) {
			await createRemindersObjects(
				triplitHttpClient as HttpClient,
				eventId,
				event.title,
				event.start_time
			);
		}

		if (event.current_attendee) {
			isUserAnAttendee = true;
		}

		if (event.private_data) {
			numAttendingGoing =
				event.private_data.num_attendees_going + event.private_data.num_temp_attendees_going;
		} else {
			const fullCounts = await normalizeAttendeeCounts(client, eventId);
			await upsertEventsPrivateData(Client, eventId, fullCounts);
		}

		// console.log("numAnnouncements", numAnnouncements)
		// console.log("numFiles", numFiles)
	}

	if (!isUserAnAttendee && user) {
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

	const bannerInfo = {
		bannerIsSet,
		bannerSmallSizeUrl,
		bannerLargeSizeUrl,
		bannerBlurHash,
		unsplashAuthorName,
		unsplashAuthorUsername
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
