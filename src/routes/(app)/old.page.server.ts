// import { generateSignedUrl } from '$lib/server/filestorage.js';
// import { triplitHttpClient } from '$lib/server/triplit';
// import { createRemindersObjects } from '$lib/triplit.js';
// import { and } from '@triplit/client';
// import { mainDemoEventId, Status } from '$lib/enums';
// import type { HttpClient } from '@triplit/client';


// Step 2: Implement the form load function
export const load = async () => {
	// const eventId = mainDemoEventId;

	// // console.log('logged in user', user);
	// let event = null;
	// let numAttendingGoing = 0;
	// let numAnnouncements = 0;
	// let numFiles = 0;

	// let bannerIsSet = false;
	// let bannerSmallSizeUrl = null;
	// let bannerLargeSizeUrl = null;
	// let bannerBlurHash = '';
	// let numBringListItems = 0;

	// try {
	// 	event = await triplitHttpClient.fetchOne(
	// 		triplitHttpClient
	// 			.query('events')
	// 			.Where(and([['id', '=', eventId as string]]))
	// 			.Include('announcements_list', (rel) => rel('announcements').Select(['id']))
	// 			.Include('attendees')
	// 			.Include('temporary_attendees')
	// 			.Include('files_list', (rel) => rel('files').Select(['id']))
	// 			.Include('banner_media')
	// 			.Include('event_admins')
	// 			.Include('bring_items_list', (rel) => rel('bring_items').Select(['id']))
	// 			.Include('event_reminders')
	// 			.SubqueryOne(
	// 				'organizer',
	// 				triplitHttpClient
	// 					.query('user')
	// 					.Where(['id', '=', '$1.user_id'])
	// 					.Select(['username', 'id'])
	// 			)
	// 	);
	// } catch (e) {
	// 	console.debug(`failed to fetch event with id ${eventId}`, e);
	// }
    
	// if (event != null) {
	// 	if (event.attendees != null) {
	// 		// Count only attendees with status "GOING" and include guest count
	// 		numAttendingGoing += event.attendees.reduce(
	// 			(total, attendee) =>
	// 				attendee.status === Status.GOING ? total + (attendee.guest_count || 0) + 1 : total,
	// 			0
	// 		);
	// 	}
	// 	if (event.temporary_attendees != null) {
	// 		// Count only temporary attendees with status "GOING" and include guest count
	// 		numAttendingGoing += event.temporary_attendees.reduce(
	// 			(total, attendee) =>
	// 				attendee.status === Status.GOING ? total + (attendee.guest_count || 0) + 1 : total,
	// 			0
	// 		);
	// 	}
	// 	if (event.announcements_list != null) {
	// 		numAnnouncements = event.announcements_list.length;
	// 	}
	// 	if (event.files_list != null) {
	// 		numFiles = event.files_list.length;
	// 	}
	// 	if (event.banner_media) {
	// 		bannerIsSet = true;
	// 		const image = event.banner_media;
	// 		bannerLargeSizeUrl = await generateSignedUrl(image.full_image_key);
	// 		bannerSmallSizeUrl = await generateSignedUrl(image.small_image_key);
	// 		bannerBlurHash = image.blurr_hash;
	// 	}

	// 	if (event.bring_items_list) {
	// 		numBringListItems = event.bring_items_list.length;
	// 	}

	// 	if (event.event_reminders.length == 0) {
	// 		await createRemindersObjects(
	// 			triplitHttpClient as HttpClient,
	// 			eventId,
	// 			event.title,
	// 			event.start_time
	// 		);
	// 	}

	// 	// console.log("numAnnouncements", numAnnouncements)
	// 	// console.log("numFiles", numFiles)
	// }

	// const bannerInfo = {
	// 	bannerIsSet,
	// 	bannerSmallSizeUrl,
	// 	bannerLargeSizeUrl,
	// 	bannerBlurHash
	// };
	// return {
	// 	event,
	// 	numBringListItems,
	// 	numAttendingGoing,
	// 	numAnnouncements,
	// 	numFiles,
	// 	bannerInfo
	// };
	return {}
};
