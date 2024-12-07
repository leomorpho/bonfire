import { createNewUser } from '$lib/server/database/user.model';
import { generateId } from 'lucia';
import { faker } from '@faker-js/faker';
import type { TriplitClient } from '@triplit/client';
import { serverTriplitClient } from '$lib/server/triplit';
import { AttendanceStatus } from '$lib/enums';
import { error } from '@sveltejs/kit';

const client = serverTriplitClient as TriplitClient;

const user = await createNewUser({
	id: generateId(15),
	email: 'mike@test.com',
	email_verified: true,
	num_logs: 3
});
if (!user) {
	throw Error("failed to create main user");
}

await client.insert('user', {
	id: user.id,
	username: 'Mike',
	profile_image: null // Adjust for the `profile_image` relation
});

const now = new Date(); // Current date and time
const fiveWeeksLater = new Date(now.getTime() + 5 * 7 * 24 * 60 * 60 * 1000); // Add 5 weeks in milliseconds

const { output } = await client.insert('events', {
	id: generateId(15), // Generate a unique ID for the event
	created_by_user_id: user.id,
	event_name: "Mike's birthday party",
	description: 'Bring your joy and party tricks',
	start_time: fiveWeeksLater,
	end_time: null,
	style: null,
	overlay_color: null,
	overlay_opacity: null,
	status: 'active', // Default event status
	private_details: null,
	attendees: null,
	announcements: null,
	files: null,
	reminders: null
});


if (!output){
	throw Error("failed to create evvent")
}

// NOTE: BE should automatically create that missing `attendance` object.
// await client.insert('attendees', {
// 	event_id: output.id,
// 	user_id: user?.id,
// 	status: getRandomStatus()
// });

function getRandomStatus() {
	const statuses = [AttendanceStatus.GOING, AttendanceStatus.NOT_GOING, AttendanceStatus.MAYBE];
	return statuses[Math.floor(Math.random() * statuses.length)];
}

for (let i = 0; i < 100; i++) {
	const user = await createNewUser({
		id: generateId(15),
		email: faker.internet.email(),
		email_verified: true,
		num_logs: 3
	});

	if (!user) {
		throw Error("failed to create secondary user");
	}

	await client.insert('user', {
		id: user.id,
		username: faker.internet.username(),
		profile_image: null // Adjust for the `profile_image` relation
	});

	await client.insert('attendees', {
		id: generateId(15), // Generate unique ID for attendee
		event_id: output.id,
		user_id: user?.id,
		status: getRandomStatus(),
		seen_by_organizer: false // Default value
	});

	console.log(`User ${i + 1} and event created:`, {
		user: user.email
	});
}
