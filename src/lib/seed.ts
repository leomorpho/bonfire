import { generateId } from 'lucia/dist/crypto';
import { BringListCountTypes, mainDemoEventId, Status } from './enums';
import { triplitHttpClient } from './server/triplit';
import { createNewUser } from '$lib/server/database/user.model';
import { createTempAttendance, createUserAttendance } from './rsvp';
import { faker } from '@faker-js/faker';
import { assignBringItem, createBringItem } from './bringlist';
import type { HttpClient } from '@triplit/client';
import { createNewThread, MAIN_THREAD } from './im';
import { and } from '@triplit/client';

export const getRandomStatus = () => {
	const statuses = [
		Status.GOING,
		Status.GOING,
		Status.GOING,
		Status.GOING, // 4 out of 5 chances for GOING
		Status.NOT_GOING,
		Status.MAYBE
	];
	return statuses[Math.floor(Math.random() * statuses.length)];
};

export const seedEvent = async () => {
	const eventPossiblyExisting = await triplitHttpClient.fetchById('events', mainDemoEventId);
	if (eventPossiblyExisting) {
		console.log('event already exists, not seeding again');
		return;
	}

	const userId = generateId(15);
	const user = await createNewUser({
		id: userId,
		email: 'mike@test.com',
		email_verified: true,
		num_logs: 3,
		is_event_styles_admin: true
	});

	await triplitHttpClient.insert('user', { id: userId, username: 'Mike' });

	const eventCreated = await triplitHttpClient.insert('events', {
		id: mainDemoEventId,
		title: "Mike's birthay party",
		description:
			'Come celebrate my birthday with good vibes, great company, and plenty of food & drinks. Let me know if you can make it—see you there! 🥳',
		location: '345 Cordova St, Vancouver',
		start_time: new Date(2050, 0, 1), // January 1, 2050,
		end_time: null,
		user_id: userId,
		style: `
      background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/subway-lines.jpg'); /* Replace with the URL of your tileable image */
      background-repeat: repeat; /* Tiles the image in both directions */
      background-size: auto; /* Ensures the image retains its original size */
      background-color: #ffffff; /* Fallback background color */
      width: 100%;
      height: 100%;   
        `,
		overlay_opacity: 0.526
	});

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

		const announcement = await triplitHttpClient.insert('announcement', {
			id: generateId(15),
			content: announcementContents[i],
			created_at: createdAt,
			user_id: userId as string, // Event creator is making the announcement
			event_id: eventCreated?.id
		});
		const announcementId = announcement?.id;

		// await createNewAnnouncementNotificationQueueObject(triplitHttpClient, user?.id as string, eventCreated?.id, [
		// 	announcementId
		// ]);

		announcements.push(announcementId);
	}

	const createAttendee = async (triplitHttpClient: HttpClient, existingAnnouncements: any[]) => {
		const name = faker.person.firstName();
		const email = faker.internet.email();

		const attendeeUserId = generateId(15);
		const attendeeUser = await createNewUser({
			id: attendeeUserId,
			email: email,
			email_verified: true,
			num_logs: 3,
			is_event_styles_admin: false
		});

		await triplitHttpClient.insert('user', { id: attendeeUserId, username: name });

		// if (attendeeData.photo) {
		//     const path = profileImagesDir + '/' + attendeeData.photo;
		//     // TODO: could probably check if image exists in S3 first
		//     await uploadProfileImage(path, attendeeUser?.id as string, false);
		// }

		function getBiasedRandomInt(n: number) {
			// Generate a random number between 0 and 9
			const bias = Math.random();

			// 90% of the time, return 0
			if (bias < 0.9) {
				return 0;
			}

			// 10% of the time, return a random integer between 0 and n (inclusive)
			return Math.floor(Math.random() * (n + 1));
		}

		console.log('attendeeUser.id', attendeeUserId, 'eventCreated.id', eventCreated.id);
		await createUserAttendance(
			triplitHttpClient,
			attendeeUserId as string,
			eventCreated.id,
			getRandomStatus(),
			getBiasedRandomInt(4)
		);

		// Randomly mark some users as having seen the announcements
		existingAnnouncements.forEach(async (announcementId) => {
			const hasSeen = Math.random() < 0.8; // 80% chance a user has seen the announcement
			if (hasSeen) {
				await triplitHttpClient.insert('seen_announcements', {
					id: generateId(15),
					announcement_id: announcementId,
					attendee_id: attendeeUserId as string,
					seen_at: new Date()
				});
			}
		});

		console.log(`User ${name} with email ${email} created and events/announcements seeded:`);
	};

	const numAttendees = 5;

	for (let i = 0; i < numAttendees; i++) {
		await createAttendee(triplitHttpClient, announcements);
	}

	const numTempAttendees = 2;

	for (let i = 0; i < numTempAttendees; i++) {
		await createTempAttendance(
			triplitHttpClient,
			null,
			eventCreated?.id as string,
			getRandomStatus(),
			faker.person.firstName(),
			0
		);
	}

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
		'Cheers to that! See you all at the party!',
		'Does anyone know a good bakery for the birthday cake?',
		'I can pick up the cake. Any flavor preferences for Mike?',
		"Let's get a mix of chocolate and vanilla to please everyone.",
		'We should also plan a surprise element. Any ideas?',
		"How about a surprise video message from friends who can't make it?",
		"That's a wonderful idea! I can collect the video messages.",
		'We need to decide on the timing. What time should the party start?',
		'How about 7 PM? That gives everyone time to arrive and settle in.',
		"Sounds good. I'll update the invitations with the timing.",
		'Should we have a dress code to match the retro theme?',
		"A dress code would be fun! Let's suggest 70s or 80s attire.",
		'I can create a playlist for background music before the DJ arrives.',
		"That would be great! Make sure to include some of Mike's favorite songs.",
		'We should also think about transportation. Should we arrange rides?',
		"Good point. Let's see if we can get a group discount with a ride-sharing service.",
		'I can coordinate with the venue to set up early. Who can help?',
		"I'll be there early to help with the setup. Just let me know the time.",
		"Perfect! Let's aim to be there by 5 PM to get everything ready.",
		'Does anyone have any last-minute suggestions or concerns?',
		"I think we've covered everything. This is going to be awesome!",
		"Can't wait! See you all at Mike's birthday bash!",
		'Remember to confirm your attendance on the invitation platform.',
		"I'll bring my camera to capture some candid moments.",
		"That's a great idea! We can create a shared album afterward.",
		"Let's also plan a group photo with everyone at the party.",
		'Definitely! We can take it before the cake-cutting ceremony.',
		"I'll bring some extra decorations just in case we need them.",
		"Thanks! That's very thoughtful of you.",
		"Let's make sure to keep the party area clean throughout the event.",
		'Absolutely. We can assign a few people to monitor the cleanliness.',
		"I'll bring some party games to keep the energy up.",
		'Sounds fun! We can play them between activities.',
		"Let's also have a designated area for gifts if people bring any.",
		"Good idea. I'll set up a gift table near the entrance.",
		"I'll bring some extra chairs in case we need more seating.",
		'Thanks! That will be helpful.',
		"Let's make sure to thank everyone for coming at the end of the party.",
		'Definitely. We can do a short thank-you speech before wrapping up.',
		"I'll bring some thank-you cards to hand out to the helpers.",
		"That's a nice touch! I'm sure they'll appreciate it.",
		"Let's also plan a cleanup crew for after the party.",
		'I can stay back to help with the cleanup. Who else can join?',
		"I'll help too. The more hands, the quicker it will be.",
		'Perfect! Thanks, everyone, for your help and cooperation.',
		'This is going to be an unforgettable birthday for Mike!',
		"Can't wait to celebrate with all of you!"
	];

	// Seed messages for Mike's event
	const messageCount = messages.length; // Number of messages to generate
	const attendees = await triplitHttpClient.fetch(
		triplitHttpClient.query('attendees').Where(['event_id', '=', eventCreated?.id])
	);

	await createNewThread(triplitHttpClient, eventCreated.id, userId, MAIN_THREAD);

	const thread = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('event_threads').Where([
			and([
				['event_id', '=', eventCreated?.id],
				['name', '=', MAIN_THREAD]
			])
		])
	);
	if (!thread) {
		throw new Error('thread not created');
	}

	const seedMessages = async () => {
		const startTime = new Date(); // Start time (current time or any specific time you want)
		startTime.setDate(startTime.getDate() - 1); // Subtract one day to get yesterday
		const interval = 5 * 60 * 1000; // 5 minutes in milliseconds

		for (let i = 0; i < messageCount; i++) {
			const randomAttendee = attendees[Math.floor(Math.random() * attendees.length)]; // Pick random user
			const messageContent = messages[i]; // Get the predefined message content

			// Calculate the time for this message (start time + 5 minutes * i)
			const messageTime = new Date(startTime.getTime() + interval * i).toISOString();

			await triplitHttpClient.insert('event_messages', {
				thread_id: thread?.id,
				user_id: randomAttendee.user_id,
				content: messageContent,
				created_at: messageTime
			});
		}

		console.log(`Seeded ${messageCount} messages for Mike's event.`);
	};

	if (!attendees || attendees.length === 0) {
		console.error('No attendees found for the event.');
	} else {
		await seedMessages();
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
	await createAndAssignBringItems(
		triplitHttpClient,
		eventCreated.id,
		userId as string,
		attendees
	);

	const notifQueueItems = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('notifications_queue')
			.Where(['event_id', '=', eventCreated.id])
			.Select(['id'])
	);

	for (const n of notifQueueItems) {
		await triplitHttpClient.delete('notifications_queue', n.id);
	}
};
