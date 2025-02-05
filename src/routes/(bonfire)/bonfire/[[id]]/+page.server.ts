import { Status, tempAttendeeSecretParam } from '$lib/enums';
import { generateSignedUrl } from '$lib/filestorage.js';
import { triplitHttpClient } from '$lib/server/triplit';
import { redirect } from '@sveltejs/kit';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async ({ params, locals, url }) => {
	const eventId = params.id; // Get the event ID from the route parameters

	if (!eventId) {
		redirect(302, '/dashboard');
	}

	// Get the user from locals
	const user = locals.user;
	console.log('logged in user', user);
	let event = null;
	let numAttendees = 0;
	let numAttendingGoing = 0;
	let numAnnouncements = null;
	let numFiles = null;

	let banneIsSet = false;
	let bannerSmallSizeUrl = null;
	let bannerLargeSizeUrl = null;
	let bannerBlurHash = '';

	let tempAttendeeId;
	const tempAttendeeSecretStr = url.searchParams.get(tempAttendeeSecretParam);
	if (tempAttendeeSecretStr) {
		try {
			const existingAttendee = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('temporary_attendees')
					.where(['secret_mapping.id', '=', tempAttendeeSecretStr])
					.build()
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
				.where(['id', '=', eventId as string])
				.include('announcements')
				.include('attendees')
				.include('temporary_attendees')
				.include('files')
				.include('banner_media')
				.subquery(
					'organizer',
					triplitHttpClient
						.query('user')
						.where(['id', '=', '$1.user_id'])
						.select(['username', 'id'])
						.build(),
					'one'
				)
				.build()
		);
		if (event != null) {
			// console.log('---> event', event);
			if (event.attendees != null) {
				numAttendees += event.attendees.length;

				// Count only attendees with status "GOING"
				numAttendingGoing += event.attendees.filter(
					(attendee) => attendee.status === Status.GOING
				).length;

				// Check if the current user is among the attendees
				isUserAnAttendee = event.attendees.some((attendee) => attendee.user_id === user?.id);
			}
			if (event.temporary_attendees != null) {
				numAttendees += event.temporary_attendees.length;

				// Count only temporary attendees with status "GOING"
				numAttendingGoing += event.temporary_attendees.filter(
					(attendee) => attendee.status === Status.GOING
				).length;

				if (!isUserAnAttendee) {
					isUserAnAttendee = event.temporary_attendees.some(
						(attendee) => attendee.user_id === user?.id
					);
				}
			}
			if (event.announcements != null) {
				numAnnouncements = event.announcements.length;
			}
			if (event.files != null) {
				numFiles = event.files.length;
			}
			if (event.banner_media) {
				banneIsSet = true;
				const image = event.banner_media;
				bannerLargeSizeUrl = await generateSignedUrl(image.full_image_key);
				bannerSmallSizeUrl = await generateSignedUrl(image.small_image_key);
				bannerBlurHash = image.blurr_hash;
			}

			// console.log("numAttendees", numAttendees)
			// console.log("numAnnouncements", numAnnouncements)
			// console.log("numFiles", numFiles)
		}
	} catch (e) {
		console.debug(`failed to fetch event with id ${eventId}`, e);
	}

	const bannerInfo = {
		banneIsSet,
		bannerSmallSizeUrl,
		bannerLargeSizeUrl,
		bannerBlurHash
	};
	return {
		user,
		event,
		numAttendees,
		numAttendingGoing,
		numAnnouncements,
		numFiles,
		tempAttendeeId,
		bannerInfo,
		isUserAnAttendee
	};
};
