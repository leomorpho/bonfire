// src/routes/api/user/[id]/delete/+server.ts

import { eq } from 'drizzle-orm';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/database/db';
import {
	emailVerificationTokenTable,
	notificationPermissionTable,
	pushSubscriptionTable,
	sessionTable,
	signinTable,
	userTable,
	deletedUserTable
} from '$lib/server/database/schema';
import { triplitHttpClient } from '$lib/server/triplit';
import { or } from '@triplit/client';

const client = triplitHttpClient;

export const DELETE = async (event: RequestEvent) => {
	const user = event.locals.user;
	if (!user || !user.id) {
		throw error(401, 'Unauthorized'); // Return 401 if user is not logged in
	}
	const userId = user.id;

	try {
		// Start a transaction to ensure atomicity
		await db.transaction(async (tx) => {
			// Delete related rows in dependent tables
			await tx
				.delete(emailVerificationTokenTable)
				.where(eq(emailVerificationTokenTable.user_id, userId));
			await tx.delete(sessionTable).where(eq(sessionTable.userId, userId));
			await tx.delete(signinTable).where(eq(signinTable.email, userId)); // Assuming email is used for signin tracking
			await tx.delete(pushSubscriptionTable).where(eq(pushSubscriptionTable.userId, userId));
			await tx
				.delete(notificationPermissionTable)
				.where(eq(notificationPermissionTable.userId, userId));

			// Insert into deleted_user table
			await tx.insert(deletedUserTable).values({ userId });

			// Finally, delete the user
			await tx.delete(userTable).where(eq(userTable.id, userId));
		});

		// Delete events user created
		const eventsQuery = client
			.query('events')
			.Where(['user_id', '=', userId])
			.Select(['id'])
			;
		const events = await client.fetch(eventsQuery);
		const eventIds = events.map((event) => event.id);

		for (const event of events) {
			await client.delete('events', event.id);
		}

		// Delete files user uploaded
		const filesQuery = client
			.query('files')
			.Where(
				or([
					['uploader_id', '=', userId],
					['event_id', 'in', eventIds]
				])
			)
			.Select(['id'])
			;
		const files = await client.fetch(filesQuery);
		for (const file of files) {
			await client.delete('files', file.id);
		}

		// Delete files uploaded to the user's events

		const attendeesQuery = client
			.query('attendees')
			.Where(
				or([
					['user_id', '=', userId],
					['event_id', 'in', eventIds]
				])
			)
			.Select(['id'])
			;
		const attendees = await client.fetch(attendeesQuery);
		for (const attendee of attendees) {
			await client.delete('attendees', attendee.id);
		}

		const notificationsQuery = client
			.query('notifications')
			.Where(['user_id', '=', userId])
			.Select(['id'])
			;
		const notifications = await client.fetch(notificationsQuery);
		for (const notification of notifications) {
			await client.delete('notifications', notification.id);
		}

		const profileImagesQuery = client
			.query('profile_images')
			.Where(['user_id', '=', userId])
			.Select(['id'])
			;
		const profileImages = await client.fetch(profileImagesQuery);
		for (const profileImage of profileImages) {
			await client.delete('profile_images', profileImage.id);
		}

		await client.delete('user', userId);

		// Return success response
		return json({ success: true, message: `User ${userId} and related data deleted successfully` });
	} catch (err) {
		console.error('Error deleting user:', err);
		throw error(500, 'Failed to delete user');
	}
};
