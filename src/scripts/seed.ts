import { createNewUser } from '$lib/server/database/user.model';
import { generateId } from 'lucia';
import { faker } from '@faker-js/faker';
import { and, HttpClient } from '@triplit/client';
import { BringListCountTypes, Status } from '$lib/enums';
import {
	createNewAnnouncementNotificationQueueObject,
	createNewAttendanceNotificationQueueObject
} from '$lib/notification_queue';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { createNewThread, MAIN_THREAD } from '$lib/im';
import { uploadBannerImage, uploadProfileImage } from '$lib/server/filestorage';
import { assignBringItem, createBringItem } from '$lib/bringlist';
import { createTempAttendance, createUserAttendance } from '$lib/rsvp';

const profileImagesDir = 'src/scripts/data/profile-pics';
const bannerImagesDir = 'src/scripts/data/banner';

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

const path = profileImagesDir + '/mike.jpg';
// TODO: could probably check if image exists in S3 first
await uploadProfileImage(path, user?.id as string, false);

const now = new Date(); // Current date and time
const fiveWeeksLater = new Date(now.getTime() + 5 * 7 * 24 * 60 * 60 * 1000); // Add 5 weeks in milliseconds

const output = await client.insert('events', {
	title: "Mike's birthay party",
	description:
		'Come celebrate my birthday with good vibes, great company, and plenty of food & drinks. Let me know if you can make it—see you there! 🥳',
	location: '345 Cordova St, Vancouver',
	start_time: fiveWeeksLater,
	end_time: null,
	user_id: user?.id,
	style: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/subway-lines.jpg'); /* Replace with the URL of your tileable image */
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

const bannerImagePath = bannerImagesDir + '/mike-bd-banner.jpg';
await uploadBannerImage(bannerImagePath, user?.id as string, eventCreated.id, false);

await createNewThread(client, output.id, user?.id as string, MAIN_THREAD);

await client.insert('events', {
	title: 'Hangout at Cactus',
	description: 'Come and chill with friends and good food',
	location: faker.location.streetAddress(),
	start_time: fiveWeeksLater,
	end_time: null,
	user_id: user2?.id,
	style: null,
	overlay_color: null,
	overlay_opacity: null,
	is_published: true
});

function getRandomStatus() {
	const statuses = [
		Status.GOING,
		Status.GOING,
		Status.GOING,
		Status.GOING, // 4 out of 5 chances for GOING
		Status.NOT_GOING,
		Status.MAYBE
	];
	return statuses[Math.floor(Math.random() * statuses.length)];
}

// Define plausible announcements for the birthday BBQ
const announcementContents = [
	"Exciting news! We've confirmed the venue. It's going to be at the beautiful Green Meadows Park. See you all there!",
	"Just a reminder to bring your favorite BBQ sides or desserts to share. Let's make this a potluck to remember!",
	"We've got some fun games planned for the BBQ! Feel free to bring any outdoor games you'd like to play as well.",
	"Don't forget to RSVP if you haven't already. We need a headcount for food and drinks. Thanks!"
];

// Create announcements
const announcements = [];
const daysBack = 5; // Start 5 days back

for (let i = 0; i < announcementContents.length; i++) {
	const createdAt = new Date();
	createdAt.setDate(createdAt.getDate() - (daysBack - i)); // Spread dates from 5 days back to today

	const announcement = await client.insert('announcement', {
		id: generateId(15),
		content: announcementContents[i],
		created_at: createdAt,
		user_id: user?.id, // Event creator is making the announcement
		event_id: eventCreated?.id
	});
	const announcementId = announcement?.id;

	await createNewAnnouncementNotificationQueueObject(client, user?.id as string, eventCreated?.id, [
		announcementId
	]);

	announcements.push(announcementId);
}

const knownData = [
	{ email: 'alice.johnson@example.com', username: 'Alice', photo: 'alice.jpg' },
	{ email: 'bob.smith@example.com', username: 'Bob', photo: 'bob.jpg' },
	{ email: 'charlie.brown@example.com', username: 'Charlie', photo: 'charlie.jpg' },
	{ email: 'diana.prince@example.com', username: 'diana', photo: 'diana.jpg' },
	{ email: 'edward.lee@example.com', username: 'edward', photo: 'edward.jpg' },
	{ email: 'fiona.white@example.com', username: 'fiona', photo: 'fiona.jpeg' },
	{ email: 'george.clark@example.com', username: 'George', photo: 'george.jpg' },
	{ email: 'hannah.nguyen@example.com', username: 'Hannah', photo: 'hannah.jpg' },
	{ email: 'ian.martinez@example.com', username: 'Ian', photo: 'ian.jpg' },
	{ email: 'julia.rodriguez@example.com', username: 'julia', photo: 'julia.jpg' },
	{ email: 'kevin.lopez@example.com', username: 'kevin', photo: 'kevin.jpg' },
	{ email: 'lucy.hernandez@example.com', username: 'lucy', photo: 'lucy.jpg' },
	{ email: 'michael.moore@example.com', username: 'Michael', photo: 'michael.jpg' },
	{ email: 'nina.taylor@example.com', username: 'Nina', photo: 'nina.jpg' },
	{ email: 'oliver.anderson@example.com', username: 'olivera', photo: 'oliver.jpg' }
];

for (let i = 0; i < knownData.length; i++) {
	const attendeeData = knownData[i];

	const attendeeUser = await createNewUser({
		id: generateId(15),
		email: attendeeData.email,
		email_verified: true,
		num_logs: 3,
		is_event_styles_admin: false
	});

	await client.insert('user', { id: attendeeUser?.id, username: attendeeData.username });

	if (attendeeData.photo) {
		const path = profileImagesDir + '/' + attendeeData.photo;
		// TODO: could probably check if image exists in S3 first
		await uploadProfileImage(path, attendeeUser?.id as string, false);
	}

	/**
	 * Generates a random integer between 0 and n (inclusive).
	 *
	 * @param {number} n - The upper bound of the random integer.
	 * @returns {number} - A random integer between 0 and n.
	 */
	function getRandomInt(n: number) {
		return Math.floor(Math.random() * (n + 1));
	}

	console.log('attendeeUser.id', attendeeUser?.id, 'eventCreated.id', eventCreated.id);
	const newAttendeeResult = await createUserAttendance(
		client,
		attendeeUser?.id as string,
		eventCreated.id,
		getRandomStatus(),
		getRandomInt(4)
	);

	await createNewAttendanceNotificationQueueObject(
		client,
		attendeeUser?.id as string,
		eventCreated?.id,
		[newAttendeeResult?.id]
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

await createTempAttendance(
	client,
	null,
	eventCreated?.id as string,
	getRandomStatus(),
	'Maxime',
	0
);
await createTempAttendance(
	client,
	null,
	eventCreated?.id as string,
	getRandomStatus(),
	'Roxanne',
	2
);
await createTempAttendance(
	client,
	null,
	eventCreated?.id as string,
	getRandomStatus(),
	'Christa',
	5
);
await createTempAttendance(client, null, eventCreated?.id as string, getRandomStatus(), 'Abodo', 3);

const messages = [
	"Hey everyone! Let's start planning Mike's birthday party. Any ideas for the venue?",
	'I think a rooftop bar would be great! What do you all think?',
	'Sounds good! We should also decide on a theme. Maybe something retro?',
	'Retro sounds fun! I can help with the decorations.',
	"I know a great DJ who can play some retro tunes. I'll reach out to him.",
	'Perfect! What about food? Should we go for finger foods or a full meal?',
	'Finger foods would be easier to manage. We can have a variety of options.',
	'I agree. I can help with the catering. Any dietary restrictions we should consider?',
	"Let's make sure there are vegetarian and gluten-free options.",
	'Great idea! Also, we need to think about drinks. Should we have an open bar?',
	"An open bar would be nice, but let's also have some non-alcoholic options.",
	'Definitely! We can have a signature mocktail as well.',
	'I can design some invitations. Should we send them out digitally or physically?',
	'Digital would be faster and more eco-friendly. We can use an online platform.',
	"Sounds good. Let's finalize the guest list and send out the invitations ASAP.",
	"I'll compile the guest list and share it with everyone. Please review and let me know if I missed anyone.",
	"Don't forget to include Mike's close friends from college.",
	"Got it! I'll make sure they're on the list.",
	'We should also plan some games or activities. Any suggestions?',
	'How about a photo booth with retro props?',
	"That's a fun idea! We can also have a trivia game about Mike.",
	'I can prepare the trivia questions. Any specific topics we should cover?',
	'Maybe some questions about his favorite movies, music, and hobbies.',
	"Perfect! Let's also think about a small gift or favor for the guests.",
	"How about personalized keychains or coasters with Mike's initials?",
	'That sounds nice! I can look into getting those made.',
	"Great! We're making good progress. Let's keep the momentum going.",
	"I'll send out the invitations tomorrow. Please let me know if you have any last-minute additions.",
	'Thanks, everyone! This is going to be an amazing party for Mike.',
	"Looking forward to it! Let's make it a night to remember.",
	'Cheers to that! See you all at the party!'
];

// Seed messages for Mike's event
const messageCount = messages.length; // Number of messages to generate
const attendees = await client.fetch(
	client.query('attendees').Where(['event_id', '=', eventCreated?.id])
);

const thread = await client.fetchOne(
	client.query('event_threads').Where([
		and([
			['event_id', '=', eventCreated?.id],
			['name', '=', MAIN_THREAD]
		])
	])
);
if (!thread) {
	throw new Error('thread not created');
}

if (!attendees || attendees.length === 0) {
	console.error('No attendees found for the event.');
} else {
	const startTime = new Date(); // Start time (current time or any specific time you want)
	startTime.setDate(startTime.getDate() - 1); // Subtract one day to get yesterday
	const interval = 5 * 60 * 1000; // 5 minutes in milliseconds

	for (let i = 0; i < messageCount; i++) {
		const randomAttendee = attendees[Math.floor(Math.random() * attendees.length)]; // Pick random user
		const messageContent = messages[i]; // Get the predefined message content

		// Calculate the time for this message (start time + 5 minutes * i)
		const messageTime = new Date(startTime.getTime() + interval * i).toISOString();

		await client.insert('event_messages', {
			thread_id: thread?.id,
			user_id: randomAttendee.user_id,
			content: messageContent,
			created_at: messageTime
		});
	}

	console.log(`Seeded ${messageCount} messages for Mike's event.`);
}

// Bring list items

// Define bring items for the BBQ
const bringItems = [
	{
		name: 'Coca Cola',
		unit: BringListCountTypes.COUNT,
		quantityNeeded: 6,
		details: '2-liter bottles'
	},
	{
		name: 'Hot Dog Buns',
		unit: BringListCountTypes.COUNT,
		quantityNeeded: 20,
		details: ''
	},
	{
		name: 'Potato Chips',
		unit: BringListCountTypes.COUNT,
		quantityNeeded: 4,
		details: 'Large bags'
	},
	{
		name: 'Paper Plates',
		unit: BringListCountTypes.COUNT,
		quantityNeeded: 30,
		details: 'Any plate will do'
	},
	{
		name: 'Plastic Cups',
		unit: BringListCountTypes.PER_PERSON,
		quantityNeeded: 30,
		details: ''
	},
	{ name: 'Ice', unit: BringListCountTypes.COUNT, quantityNeeded: 2, details: 'Bags of ice' }
];

async function createAndAssignBringItems(
	client: HttpClient,
	eventId: string,
	adminUserId: string,
	attendees: any
) {
	const createdItems = [];

	// Create bring items
	for (const item of bringItems) {
		const createdItem = await createBringItem(
			client,
			eventId,
			adminUserId,
			item.name,
			item.unit,
			item.quantityNeeded,
			item.details
		);
		createdItems.push(createdItem);
	}

	// Assign bring items to attendees
	for (const item of createdItems) {
		const totalQuantity = item.quantity_needed;
		const percentageToAssign = Math.random(); // Random percentage between 0 and 100
		const quantityToAssign = Math.round(totalQuantity * percentageToAssign);
		let remainingQuantity = quantityToAssign;

		while (remainingQuantity > 0) {
			const attendee = attendees[Math.floor(Math.random() * attendees.length)];
			const quantityForAttendee = Math.min(Math.ceil(Math.random() * 5), remainingQuantity); // Assign a random quantity up to 5 or remaining quantity

			await assignBringItem(
				client,
				item.id,
				attendee.user_id,
				null,
				adminUserId,
				quantityForAttendee
			);

			remainingQuantity -= quantityForAttendee;
		}
	}

	console.log('Bring items created and assigned to attendees.');
}

// Create and assign bring items for Mike's event
await createAndAssignBringItems(client, eventCreated.id, user?.id as string, attendees);
