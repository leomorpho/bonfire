import {
	NotificationType,
	NOTIFY_OF_ATTENDING_STATUS_CHANGE,
	NotificationPermissions,
	Status,
	notificationTypeToPermMap
} from '$lib/enums';
import {
	getAdminUserIdsOfEvent,
	getAttendeeUserIdsOfEvent,
	triplitHttpClient
} from '$lib/server/triplit';
import { Notification } from '$lib/server/notifications/engine';

export async function createAnnouncementNotifications(
	eventId: string,
	announcementIds: string[]
): Promise<Notification[]> {
	if (!announcementIds.length) return [];

	const { granted: attendingUserIdsGranted, notGranted: attendingUserIdsNotGranted } =
		await getAttendeeUserIdsOfEvent(
			eventId,
			NOTIFY_OF_ATTENDING_STATUS_CHANGE,
			true, // Do not notify announcement creator, i.e., event creator
			notificationTypeToPermMap[NotificationType.ANNOUNCEMENT] as NotificationType
		);

	// TODO: filter out people who've already seen it
	const notifications: Notification[] = [];

	const createNotificationsForUsers = (userIds: string[], isInAppOnly: boolean) => {
		for (const attendeeUserId of userIds) {
			const numObjects = announcementIds.length;
			const message = `📢 You have ${numObjects} new ${numObjects > 1 ? 'announcements' : 'announcement'} in an event you're attending!`;
			const pushNotificationPayload = { title: 'New Announcements', body: message };

			notifications.push(
				new Notification(
					eventId,
					attendeeUserId,
					message,
					NotificationType.ANNOUNCEMENT,
					announcementIds,
					pushNotificationPayload,
					[NotificationPermissions.event_activity],
					isInAppOnly // Set the isInAppOnly field
				)
			);
		}
	};

	createNotificationsForUsers(attendingUserIdsGranted, false); // Notifications for users who granted permissions
	createNotificationsForUsers(attendingUserIdsNotGranted, true); // Notifications for users who did not grant permissions

	return notifications;
}

export async function createFileNotifications(
	eventId: string,
	fileIds: string[]
): Promise<Notification[]> {
	if (!fileIds.length) return [];

	const fileQuery = triplitHttpClient
		.query('files')
		.Select(['id', 'uploader_id'])
		.Where([['id', 'in', fileIds]]);
	const files = await triplitHttpClient.fetch(fileQuery);
	const fileUploaderMap = new Map(files.map((file) => [file.id, file.uploader_id]));

	const { granted: attendingUserIdsGranted, notGranted: attendingUserIdsNotGranted } =
		await getAttendeeUserIdsOfEvent(
			eventId,
			[Status.GOING, Status.MAYBE],
			false,
			notificationTypeToPermMap[NotificationType.FILES] as NotificationType
		);

	const notifications: Notification[] = [];

	const createNotificationsForUsers = (userIds: string[], isInAppOnly: boolean) => {
		for (const attendeeUserId of userIds) {
			const filteredFileIds = fileIds.filter(
				(fileId) => fileUploaderMap.get(fileId) !== attendeeUserId
			);

			if (!filteredFileIds.length) continue;

			const numObjects = filteredFileIds.length;
			const message = `📷 You have ${numObjects} new media ${numObjects > 1 ? 'files' : 'file'} in an event you're attending!`;
			const pushNotificationPayload = { title: 'New Files', body: message };

			notifications.push(
				new Notification(
					eventId,
					attendeeUserId,
					message,
					NotificationType.FILES,
					filteredFileIds,
					pushNotificationPayload,
					[NotificationPermissions.event_activity],
					isInAppOnly // Set the isInAppOnly field
				)
			);
		}
	};

	createNotificationsForUsers(attendingUserIdsGranted, false); // Notifications for users who granted permissions
	createNotificationsForUsers(attendingUserIdsNotGranted, true); // Notifications for users who did not grant permissions

	return notifications;
}

export async function createAttendeeNotifications(
	eventId: string,
	attendeeIds: string[]
): Promise<Notification[]> {
	if (!attendeeIds.length) return [];

	const creatorQuery = triplitHttpClient
		.query('events')
		.Select(['user_id', 'title'])
		.Where([['id', '=', eventId]]);
	const [event] = await triplitHttpClient.fetch(creatorQuery);

	if (!event) return [];

	const attendeeCount = attendeeIds.length;
	const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
	const message = `🍻 ${attendeeCount} new ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

	const pushNotificationPayload = { title: 'New Attendees', body: message };

	const { granted, notGranted } = await getAdminUserIdsOfEvent(
		eventId,
		notificationTypeToPermMap[NotificationType.ADMIN_UPDATES] as NotificationType
	);

	const notifications: Notification[] = [];

	// Create notifications for granted users
	for (const userId of granted) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.ATTENDEES,
				attendeeIds,
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly = false
			)
		);
	}

	// Create notifications for not granted users
	for (const userId of notGranted) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.ATTENDEES,
				attendeeIds,
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				true // isInAppOnly = true
			)
		);
	}

	return notifications;
}

export async function createTempAttendeeNotifications(
	eventId: string,
	attendeeIds: string[]
): Promise<Notification[]> {
	if (!attendeeIds.length) return [];

	const creatorQuery = triplitHttpClient
		.query('events')
		.Select(['user_id', 'title'])
		.Where([['id', '=', eventId]]);
	const [event] = await triplitHttpClient.fetch(creatorQuery);

	if (!event) return [];

	const attendeeCount = attendeeIds.length;
	const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
	const message = `🍻 ${attendeeCount} new temporary account ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

	const pushNotificationPayload = { title: 'New Temporary Account Attendees', body: message };

	const { granted, notGranted } = await getAdminUserIdsOfEvent(
		eventId,
		notificationTypeToPermMap[NotificationType.ADMIN_UPDATES] as NotificationType
	);

	const notifications: Notification[] = [];

	// Create notifications for granted users
	for (const userId of granted) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.TEMP_ATTENDEES,
				attendeeIds,
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly = false
			)
		);
	}

	// Create notifications for not granted users
	for (const userId of notGranted) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.TEMP_ATTENDEES,
				attendeeIds,
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				true // isInAppOnly = true
			)
		);
	}

	return notifications;
}
export async function createAdminAddedNotifications(
	eventId: string,
	newAdminUserIds: string[]
): Promise<Notification[]> {
	const creatorQuery = triplitHttpClient
		.query('events')
		.Select(['id', 'title'])
		.Where([['id', '=', eventId]]);
	const [event] = await triplitHttpClient.fetch(creatorQuery);

	if (!event) return [];

	const { granted, notGranted } = await getAdminUserIdsOfEvent(
		eventId,
		notificationTypeToPermMap[NotificationType.ADMIN_UPDATES] as NotificationType
	);

	const notifications: Notification[] = [];

	for (const newAdminUserId of newAdminUserIds) {
		const message = `🔐 You have been made an admin for the event: "${event.title}".`;
		const pushNotificationPayload = { title: "You're now an event admin!", body: message };

		// Create notifications for granted users
		for (const userId of granted) {
			notifications.push(
				new Notification(
					eventId,
					userId,
					message,
					NotificationType.ADMIN_ADDED,
					[newAdminUserId],
					pushNotificationPayload,
					[NotificationPermissions.event_activity],
					false // isInAppOnly = false
				)
			);
		}

		// Create notifications for not granted users
		for (const userId of notGranted) {
			notifications.push(
				new Notification(
					eventId,
					userId,
					message,
					NotificationType.ADMIN_ADDED,
					[newAdminUserId],
					pushNotificationPayload,
					[NotificationPermissions.event_activity],
					true // isInAppOnly = true
				)
			);
		}
	}

	return notifications;
}

export async function createNewMessageNotifications(
	eventId: string,
	newMessageId: string
): Promise<Notification[]> {
	if (!newMessageId) return [];

	const { granted: attendingUserIdsGranted, notGranted: attendingUserIdsNotGranted } =
		await getAttendeeUserIdsOfEvent(
			eventId,
			NOTIFY_OF_ATTENDING_STATUS_CHANGE,
			false,
			notificationTypeToPermMap[NotificationType.NEW_MESSAGE] as NotificationType
		);

	// Remove sender ID from list of attendees
	const messages = await triplitHttpClient.fetch(
		triplitHttpClient.query('event_messages').Where(['id', '=', newMessageId]).Select(['user_id'])
	);

	if (!attendingUserIdsGranted.length && !attendingUserIdsNotGranted.length) return [];

	// Extract user_ids from the messages
	const senderIds: Array<string> = messages.map((message: { user_id: string }) => message.user_id);

	// Filter out sender IDs from the list of attendees
	let filteredAttendingUserIdsGranted = attendingUserIdsGranted.filter(
		(attendeeUserId) => !senderIds.includes(attendeeUserId)
	);
	let filteredAttendingUserIdsNotGranted = attendingUserIdsNotGranted.filter(
		(attendeeUserId) => !senderIds.includes(attendeeUserId)
	);

	// Get users who've already seen the message
	const seen_by = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('event_message_seen')
			.Where(['message_id', '=', newMessageId])
			.Select(['user_id'])
	);

	const seenByUserIds: Set<string> = new Set(
		seen_by.map((seen_by: { user_id: string }) => seen_by.user_id)
	);

	// Filter out users who've already seen the message
	filteredAttendingUserIdsGranted = filteredAttendingUserIdsGranted.filter(
		(attendeeUserId) => !seenByUserIds.has(attendeeUserId)
	);
	filteredAttendingUserIdsNotGranted = filteredAttendingUserIdsNotGranted.filter(
		(attendeeUserId) => !seenByUserIds.has(attendeeUserId)
	);

	const message = `💬 You have a new message in an event you're attending`;
	const pushNotificationPayload = { title: 'New Message', body: message };

	const notifications: Notification[] = [];

	// Create notifications for granted users
	for (const userId of filteredAttendingUserIdsGranted) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.NEW_MESSAGE,
				[newMessageId],
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly = false
			)
		);
	}

	// Create notifications for not granted users
	for (const userId of filteredAttendingUserIdsNotGranted) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.NEW_MESSAGE,
				[newMessageId],
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				true // isInAppOnly = true
			)
		);
	}

	return notifications;
}
