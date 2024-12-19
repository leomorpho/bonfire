import { createNewUser } from '$lib/server/database/user.model';
import { generateId } from 'lucia';
import { faker } from '@faker-js/faker';
import type { TriplitClient } from '@triplit/client';
import { serverTriplitClient } from '$lib/server/triplit';
import { Status } from '$lib/enums';
import { execSync } from 'child_process';

// // Step 1: Run CLI commands
// try {
//     console.log('Removing local.db...');
//     execSync('rm local.db');
//     console.log('Running migrations...');
//     execSync('npm run migrate');
//     console.log('Migrations completed.');
// } catch (error) {
//     console.error('Error during CLI commands:', error.message);
//     process.exit(1); // Exit if the CLI commands fail
// }

const client = serverTriplitClient as TriplitClient;

const user = await createNewUser({
	id: generateId(15),
	email: 'mike@test.com',
	email_verified: true,
	num_logs: 3
});

const user2 = await createNewUser({
	id: generateId(15),
	email: 'jo@test.com',
	email_verified: true,
	num_logs: 3
});

await client.insert('user', { id: user.id, username: 'Mike' });
await client.insert('user', { id: user2.id, username: 'Jo' });

const now = new Date(); // Current date and time
const fiveWeeksLater = new Date(now.getTime() + 5 * 7 * 24 * 60 * 60 * 1000); // Add 5 weeks in milliseconds

const { output } = await client.insert('events', {
	title: "Mike's birthay party",
	description: 'Bring your joy and party tricks',
	location: '345 Cordova St, Vancouver',
	start_time: fiveWeeksLater,
	end_time: null,
	user_id: user.id,
	style: null,
	overlay_color: null,
	overlay_opacity: null
});

await client.insert('events', {
	title: faker.company.name(),
	description: faker.company.buzzNoun(),
	location: faker.location.streetAddress(),
	start_time: fiveWeeksLater,
	end_time: null,
	user_id: user2.id,
	style: null,
	overlay_color: null,
	overlay_opacity: null
});

// NOTE: BE should automatically create that missing `attendance` object.
// await client.insert('attendees', {
// 	event_id: output.id,
// 	user_id: user?.id,
// 	status: getRandomStatus()
// });

function getRandomStatus() {
	const statuses = [Status.GOING, Status.NOT_GOING, Status.MAYBE];
	return statuses[Math.floor(Math.random() * statuses.length)];
}

for (let i = 0; i < 100; i++) {
	const user = await createNewUser({
		id: generateId(15),
		email: faker.internet.email(),
		email_verified: true,
		num_logs: 3
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
