import { createNewUser } from '$lib/server/database/user.model';
import { generateId } from 'lucia';
import { faker } from '@faker-js/faker';
import { HttpClient } from '@triplit/client';
import { Status, BringListCountTypes } from '$lib/enums';
import { createAttendeeId } from '$lib/utils';
import { createNewThread, MAIN_THREAD } from '$lib/im';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

const client = new HttpClient({
	serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
	token: privateEnv.TRIPLIT_SERVICE_TOKEN
});

interface AttendeeData {
	user?: { id: string; email: string; username: string };
	tempAttendee?: { id: string; name: string };
	status: Status;
}

async function createEventWithAttendees(
	owner: { id: string; email: string; username: string },
	attendeesData: AttendeeData[],
	title: string,
	description: string,
	location: string,
	startTime: Date,
	endTime: Date,
	announcementsContent: string[],
	bringListItems: {
		name: string;
		unit: typeof BringListCountTypes;
		quantity_needed: number;
		details?: string;
		assignedTo?: AttendeeData[];
	}[]
) {
	// Event
	const event = await client.insert('events', {
		id: generateId(15),
		title: title,
		description: description,
		start_time: startTime,
		end_time: endTime,
		location: location,
		user_id: owner.id,
		is_demo_data: true,
		is_published: true
	});
	const eventId = event.output.id;

	//Event Thread
	await createNewThread(client, eventId, owner.id, MAIN_THREAD);

	// Attendees
	for (const attendee of attendeesData) {
		if (attendee.user) {
			await client.insert('attendees', {
				id: createAttendeeId(eventId, attendee.user.id),
				event_id: eventId,
				user_id: attendee.user.id,
				status: attendee.status,
				is_demo_data: true,
				updated_at: new Date()
			});
		} else if (attendee.tempAttendee) {
			const tempAttendee = await client.insert('temporary_attendees', {
				id: attendee.tempAttendee.id,
				event_id: eventId,
				status: attendee.status,
				name: attendee.tempAttendee.name,
				is_demo_data: true,
				updated_at: new Date()
			});
			const tempAttendeeId = tempAttendee.output.id;

			// Temp Attendee Secret Mapping
			await client.insert('temporary_attendees_secret_mapping', {
				id: generateId(15),
				temporary_attendee_id: tempAttendeeId,
				created_at: new Date()
			});
		}
	}

	// Announcements
	for (const content of announcementsContent) {
		await client.insert('announcement', {
			id: generateId(15),
			content: content,
			created_at: new Date(),
			user_id: owner.id,
			event_id: eventId,
			is_demo_data: true
		});
	}

	// Bring Items
	for (const item of bringListItems) {
		const bringItem = await client.insert('bring_items', {
			id: generateId(15),
			event_id: eventId,
			name: item.name,
			unit: item.unit,
			quantity_needed: item.quantity_needed,
			details: item.details,
			created_by_user_id: owner.id,
			created_at: new Date(),
			is_demo_data: true
		});
		const bringItemId = bringItem.output.id;

		// Bring Assignments (within the bring items loop)
		if (item.assignedTo) {
			for (const assignment of item.assignedTo) {
				if (assignment.user) {
					await client.insert('bring_assignments', {
						id: generateId(15),
						bring_item_id: bringItemId,
						assigned_to_user_id: assignment.user.id,
						quantity: Math.floor(Math.random() * item.quantity_needed) + 1, // Assign a random quantity up to the needed amount
						created_at: new Date(),
						is_demo_data: true
					});
				} else if (assignment.tempAttendee) {
					await client.insert('bring_assignments', {
						id: generateId(15),
						bring_item_id: bringItemId,
						assigned_to_temp_attendee_id: assignment.tempAttendee.id,
						quantity: Math.floor(Math.random() * item.quantity_needed) + 1,
						created_at: new Date(),
						is_demo_data: true
					});
				}
			}
		}
	}

	return { eventId };
}

async function seedDemoData() {
	// --- Create Users ---
	const users = [];
	for (let i = 0; i < 25; i++) {
		const user = await createNewUser({
			id: generateId(15),
			email: faker.internet.email(),
			email_verified: true,
			num_logs: Math.floor(Math.random() * 10), // Random number of logs
			is_event_styles_admin: Math.random() < 0.2 // 20% chance of being an admin
		});
		await client.insert('user', {
			id: user?.id,
			username: faker.internet.userName(),
			is_demo_data: true
		});

		// Profile Images
		await client.insert('profile_images', {
			id: generateId(15),
			user_id: user?.id,
			full_image_key: faker.image.avatar(), // Use a real image URL
			small_image_key: faker.image.avatar(), // Use a real image URL
			uploaded_at: new Date(),
			blurr_hash: 'somehash', // You might want a real blurhash generator
			is_demo_data: true
		});
		users.push({ id: user?.id, email: user?.email, username: user?.username });
	}

	// --- Event 1:  Board Game Night ---
	const owner1 = users[0];
	const attendees1: AttendeeData[] = [
		{ user: owner1, status: Status.GOING },
		...users.slice(1, 8).map((user) => ({ user: user, status: Status.GOING })), // 7 other users
		{ tempAttendee: { id: generateId(15), name: faker.person.fullName() }, status: Status.MAYBE }, // 1 temp
		{
			tempAttendee: { id: generateId(15), name: faker.person.fullName() },
			status: Status.NOT_GOING
		} // 1 temp
	];

	const event1 = await createEventWithAttendees(
		owner1,
		attendees1,
		'Board Game Bonanza',
		'Get ready for a night of epic board game battles!  Bring your favorite games and snacks.',
		faker.location.streetAddress(),
		faker.date.future({ refDate: '2024-05-01T00:00:00.000Z' }),
		faker.date.future({ refDate: '2024-05-02T00:00:00.000Z' }),
		['New rule: Winner gets bragging rights!', "Don't forget your lucky dice!"],
		[
			{
				name: 'Pizza',
				unit: BringListCountTypes.COUNT,
				quantity_needed: 3,
				details: 'Any kind!',
				assignedTo: [attendees1[1]]
			},
			{
				name: 'Soda',
				unit: BringListCountTypes.PER_PERSON,
				quantity_needed: 2,
				assignedTo: [attendees1[2], attendees1[3]]
			},
			{
				name: 'Board Games',
				unit: BringListCountTypes.COUNT,
				quantity_needed: 5,
				details: 'Your favorites!',
				assignedTo: attendees1
			}
		]
	);

	// --- Event 2:  Hiking Trip ---

	const owner2 = users[8];
	const attendees2: AttendeeData[] = [
		{ user: owner2, status: Status.GOING },
		...users.slice(9, 16).map((user) => ({ user: user, status: Status.GOING })), // 7 other users
		{ tempAttendee: { id: generateId(15), name: faker.person.fullName() }, status: Status.GOING }, // 1 temp
		{ tempAttendee: { id: generateId(15), name: faker.person.fullName() }, status: Status.MAYBE }, // 1 temp
		{ tempAttendee: { id: generateId(15), name: faker.person.fullName() }, status: Status.MAYBE } // 1 temp
	];

	const event2 = await createEventWithAttendees(
		owner2,
		attendees2,
		'Mountain Majesty Hike',
		'Join us for a scenic hike up Mount Awesome!  Moderate difficulty, amazing views.',
		'Mount Awesome Trailhead', // Fictional location
		faker.date.future({ refDate: '2024-06-01T00:00:00.000Z' }),
		faker.date.future({ refDate: '2024-06-02T00:00:00.000Z' }),
		["Trail conditions update: It's muddy!", 'Remember to bring water and sunscreen!'],
		[
			{
				name: 'Trail Mix',
				unit: BringListCountTypes.PER_PERSON,
				quantity_needed: 1,
				assignedTo: attendees2
			},
			{
				name: 'Water Bottles',
				unit: BringListCountTypes.PER_PERSON,
				quantity_needed: 2,
				assignedTo: attendees2
			},
			{
				name: 'First Aid Kit',
				unit: BringListCountTypes.COUNT,
				quantity_needed: 1,
				details: 'Fully stocked',
				assignedTo: [attendees2[1]]
			},
			{
				name: 'Sunscreen',
				unit: BringListCountTypes.COUNT,
				quantity_needed: 2,
				assignedTo: [attendees2[3]]
			}
		]
	);

	// --- Event 3:  Potluck Dinner ---

	const owner3 = users[17];
	const attendees3: AttendeeData[] = [
		{ user: owner3, status: Status.GOING },
		...users.slice(18).map((user) => ({ user: user, status: Status.GOING })), // Rest of the users
		{ tempAttendee: { id: generateId(15), name: faker.person.fullName() }, status: Status.GOING }, // 1 temp
		{ tempAttendee: { id: generateId(15), name: faker.person.fullName() }, status: Status.GOING }, // 1 temp
		{ tempAttendee: { id: generateId(15), name: faker.person.fullName() }, status: Status.MAYBE } // 1 temp
	];
	const event3 = await createEventWithAttendees(
		owner3,
		attendees3,
		'Global Gourmet Gathering',
		'A culinary adventure!  Bring a dish from your favorite cuisine to share.',
		faker.location.streetAddress(),
		faker.date.future({ refDate: '2024-07-01T00:00:00.000Z' }),
		faker.date.future({ refDate: '2024-07-02T00:00:00.000Z' }),
		[
			'Theme reveal: Dishes from around the world!',
			'Please label your dish with ingredients for allergies.'
		],
		[
			{
				name: 'Appetizers',
				unit: BringListCountTypes.COUNT,
				quantity_needed: 5,
				details: 'Anything goes!',
				assignedTo: attendees3.slice(0, 5)
			},
			{
				name: 'Main Dishes',
				unit: BringListCountTypes.COUNT,
				quantity_needed: 5,
				details: 'Your specialty!',
				assignedTo: attendees3.slice(5, 10)
			},
			{
				name: 'Desserts',
				unit: BringListCountTypes.COUNT,
				quantity_needed: 5,
				details: 'Sweet treats!',
				assignedTo: attendees3.slice(10, 15)
			},
			{
				name: 'Drinks',
				unit: BringListCountTypes.PER_PERSON,
				quantity_needed: 2,
				assignedTo: attendees3.slice(15)
			}
		]
	);

	console.log('Demo data seeding completed.');
}

seedDemoData().catch((error) => {
	console.error('Error seeding demo data:', error);
});
