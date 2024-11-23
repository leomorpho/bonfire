import { createNewUser } from '$lib/server/database/user.model';
import { generateId } from 'lucia';
import { faker } from '@faker-js/faker';
import type { TriplitClient } from '@triplit/client';
import { serverTriplitClient } from '$lib/triplit';
import { GOING, MAYBE, NOT_GOING } from '$lib/enums';

let client = serverTriplitClient as TriplitClient;

let user = await createNewUser({
	id: generateId(15),
	email: 'mike@test.com',
	email_verified: true
});

await client.insert('user', { id: user.id, username: 'Mike' });

const now = new Date(); // Current date and time
const fiveWeeksLater = new Date(now.getTime() + 5 * 7 * 24 * 60 * 60 * 1000); // Add 5 weeks in milliseconds

const { output } = await client.insert('events', {
	title: "Mike's birthay party",
	description: 'Bring your joy and party tricks',
	location: '345 Cordova St, Vancouver',
	start_time: fiveWeeksLater,
	end_time: null,
	user_id: user.id
});

function getRandomStatus() {
	const statuses = [GOING, NOT_GOING, MAYBE];
	return statuses[Math.floor(Math.random() * statuses.length)];
}

for (let i = 0; i < 300; i++) {
	const user = await createNewUser({
		id: generateId(15),
		email: faker.internet.email(),
		email_verified: true
	});

	await client.insert('user', { id: user.id, username: faker.internet.username() });

	await client.insert('attendees', {
		event_id: output.id,
		user_id: user?.id,
		status: getRandomStatus()
	});

	console.log(`User ${i + 1} and event created:`, {
		user: user.email
	});
}
