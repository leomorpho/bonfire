import { createNewUser } from '$lib/server/database/user.model';
import { generateId } from 'lucia';
import { faker } from '@faker-js/faker';
import { HttpClient } from '@triplit/client';
import { Status } from '$lib/enums';
import {
	createNewAnnouncementNotificationQueueObject,
	createNewAttendanceNotificationQueueObject
} from '$lib/notification';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { createAttendeeId } from '$lib/utils';

const client = new HttpClient({
	serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
	token: privateEnv.TRIPLIT_SERVICE_TOKEN
});

const user = await createNewUser({
	id: generateId(15),
	email: 'mike@test.com',
	email_verified: true,
	num_logs: 3,
	is_event_styles_admin: true
});

const user2 = await createNewUser({
	id: generateId(15),
	email: 'jo@test.com',
	email_verified: true,
	num_logs: 3,
	is_event_styles_admin: false
});

await client.insert('user', { id: user?.id, username: 'Mike' });
await client.insert('user', { id: user2?.id, username: 'Jo' });

const now = new Date(); // Current date and time
const fiveWeeksLater = new Date(now.getTime() + 5 * 7 * 24 * 60 * 60 * 1000); // Add 5 weeks in milliseconds

const { output } = await client.insert('events', {
	title: "Mike's birthay party",
	description: 'Bring your joy and party tricks',
	location: '345 Cordova St, Vancouver',
	start_time: fiveWeeksLater,
	end_time: null,
	user_id: user?.id,
	style: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/subway-lines.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `,
	overlay_color: null,
	overlay_opacity: 0.526
});
const eventCreated = output;

await client.insert('events', {
	title: 'Hangout at Cactus',
	description: 'Come and chill with friends and good food',
	location: faker.location.streetAddress(),
	start_time: fiveWeeksLater,
	end_time: null,
	user_id: user2?.id,
	style: null,
	overlay_color: null,
	overlay_opacity: null
});

function getRandomStatus() {
	const statuses = [Status.GOING, Status.NOT_GOING, Status.MAYBE];
	return statuses[Math.floor(Math.random() * statuses.length)];
}

// Create 5 announcements
const announcements = [];
const daysBack = 5; // Start 5 days back

for (let i = 0; i < 5; i++) {
	const createdAt = new Date();
	createdAt.setDate(createdAt.getDate() - (daysBack - i)); // Spread dates from 5 days back to today

	const announcement = await client.insert('announcement', {
		id: generateId(15),
		content: faker.lorem.paragraph(),
		created_at: createdAt,
		user_id: user?.id, // Event creator is making the announcement
		event_id: eventCreated?.id
	});
	const announcementId = announcement?.output?.id;

	await createNewAnnouncementNotificationQueueObject(client, user?.id as string, eventCreated?.id, [
		announcementId
	]);

	announcements.push(announcementId);
}

for (let i = 0; i < 100; i++) {
	const attendeeUser = await createNewUser({
		id: generateId(15),
		email: faker.internet.email(),
		email_verified: true,
		num_logs: 3,
		is_event_styles_admin:false,
	});

	await client.insert('user', { id: attendeeUser?.id, username: faker.internet.username() });

	const newAttendeeResult = await client.insert('attendees', {
		id: createAttendeeId(eventCreated.id, attendeeUser?.id as string),
		event_id: eventCreated?.id, // TODO: rename to something sane, that's a shit name
		user_id: attendeeUser?.id,
		status: getRandomStatus()
	});

	await createNewAttendanceNotificationQueueObject(
		client,
		attendeeUser?.id as string,
		eventCreated?.id,
		[newAttendeeResult.output?.id]
	);

	// Randomly mark some users as having seen the announcements
	announcements.forEach(async (announcementId) => {
		const hasSeen = Math.random() < 0.7; // 70% chance a user has seen the announcement
		if (hasSeen) {
			await client.insert('seen_announcements', {
				id: generateId(15),
				announcement_id: announcementId,
				attendee_id: attendeeUser?.id,
				seen_at: new Date()
			});
		}
	});

	console.log(`User ${i + 1} created and events/announcements seeded:`, {
		user: attendeeUser?.email
	});
}
