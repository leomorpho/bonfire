import {
	NotificationType,
	NOTIFY_OF_ATTENDING_STATUS_CHANGE,
	NotificationPermissions,
	Status,
	notificationTypeToPermMap,
	notificationTypeMapping,
	notificationTypeToSubject
} from '$lib/enums';
import {
	getAdminUserIdsOfEvent,
	getAttendeeUserIdsOfEvent,
	triplitHttpClient
} from '$lib/server/triplit';
import { Notification } from '$lib/server/notifications/notification';

export function createNotificationMessage(
	notificationType: NotificationType,
	numObjects: number = 1
): string {
	const { singularObjectName, pluralObjectName } = notificationTypeMapping[notificationType];
	let message = '';

	switch (notificationType) {
		case NotificationType.ANNOUNCEMENT:
			message = `📢 You have ${numObjects} new ${numObjects > 1 ? pluralObjectName : singularObjectName}`;
			break;
		case NotificationType.FILES:
			message = `📷 You have ${numObjects} new ${numObjects > 1 ? pluralObjectName : singularObjectName}`;
			break;
		case NotificationType.NEW_MESSAGE:
			message = `💬 You have ${numObjects} new ${numObjects > 1 ? pluralObjectName : singularObjectName}`;
			break;
		case NotificationType.ATTENDEES:
			message = `🍻 You have ${numObjects} new ${numObjects > 1 ? pluralObjectName : singularObjectName}`;
			break;
		case NotificationType.TEMP_ATTENDEES:
			message = `🍻 You have ${numObjects} new ${numObjects > 1 ? pluralObjectName : singularObjectName}`;
			break;
		case NotificationType.YOU_WERE_ADDED_AS_ADMIN:
			message = `🔐 You have been made an admin`;
			break;
		case NotificationType.ADMIN_ADDED:
			message = `🔐 A new admin was added`;
			break;
		case NotificationType.EVENT_INVITATION:
			message = `🎉 You've been invited to an event!`;
			break;
		case NotificationType.EVENT_CANCELLED:
			message = `❌ Event has been cancelled`;
			break;
		case NotificationType.EVENT_DELETED:
			message = `🗑️ Event has been deleted`;
			break;
		case NotificationType.SUPPORT_MESSAGE:
			message = `🆘 New support message from user`;
			break;
		case NotificationType.UNSEEN_INVITATIONS:
			message = `👁️ ${numObjects} attendee${numObjects > 1 ? 's' : ''} haven't seen their invitation${numObjects > 1 ? 's' : ''}`;
			break;
		case NotificationType.UNSEEN_ANNOUNCEMENTS:
			message = `👁️ ${numObjects} attendee${numObjects > 1 ? 's' : ''} haven't seen announcement${numObjects > 1 ? 's' : ''}`;
			break;

		default:
			message = 'You have a new notification';
	}

	return message;
}

export async function createAnnouncementNotifications(
	userIdTriggeredNotif: string,
	eventId: string,
	announcementIds: string[]
): Promise<Notification[]> {
	if (!announcementIds.length) return [];

	const { granted: attendingUserIdsGranted, notGranted: attendingUserIdsNotGranted } =
		await getAttendeeUserIdsOfEvent(
			eventId,
			NOTIFY_OF_ATTENDING_STATUS_CHANGE,
			notificationTypeToPermMap[NotificationType.ANNOUNCEMENT] as NotificationType,
			[userIdTriggeredNotif]
		);

	// TODO: filter out people who've already seen it
	const notifications: Notification[] = [];

	const createNotificationsForUsers = (userIds: string[], isInAppOnly: boolean) => {
		for (const attendeeUserId of userIds) {
			const numObjects = announcementIds.length;
			const message = createNotificationMessage(NotificationType.ANNOUNCEMENT, numObjects);
			const pushNotificationPayload = { title: 'New Announcements', body: message };

			notifications.push(
				new Notification(
					eventId,
					attendeeUserId,
					message,
					NotificationType.ANNOUNCEMENT,
					announcementIds,
					new Set(announcementIds),
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
	userIdTriggeredNotif: string,
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
			notificationTypeToPermMap[NotificationType.FILES] as NotificationType,
			[userIdTriggeredNotif]
		);

	const notifications: Notification[] = [];

	const createNotificationsForUsers = (userIds: string[], isInAppOnly: boolean) => {
		for (const attendeeUserId of userIds) {
			const filteredFileIds = fileIds.filter(
				(fileId) => fileUploaderMap.get(fileId) !== attendeeUserId
			);

			if (!filteredFileIds.length) continue;

			const numObjects = filteredFileIds.length;
			const message = createNotificationMessage(NotificationType.FILES, numObjects);
			const pushNotificationPayload = { title: 'New Files', body: message };

			notifications.push(
				new Notification(
					eventId,
					attendeeUserId,
					message,
					NotificationType.FILES,
					filteredFileIds,
					new Set(filteredFileIds),
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
	userIdTriggeredNotif: string,
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

	const message = createNotificationMessage(NotificationType.ATTENDEES, attendeeCount);
	const pushNotificationPayload = { title: 'New Attendees', body: message };

	const { granted, notGranted } = await getAdminUserIdsOfEvent(
		eventId,
		notificationTypeToPermMap[NotificationType.ADMIN_UPDATES] as NotificationType,
		[userIdTriggeredNotif] // NOTE: in case user was made admin before new attendee notif was sent
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
				new Set(attendeeIds),
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
				new Set(attendeeIds),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				true // isInAppOnly = true
			)
		);
	}

	return notifications;
}

export async function createTempAttendeeNotifications(
	userIdTriggeredNotif: string,
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

	const message = createNotificationMessage(NotificationType.TEMP_ATTENDEES, attendeeCount);
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
				new Set(attendeeIds),
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
				new Set(attendeeIds),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				true // isInAppOnly = true
			)
		);
	}

	return notifications;
}
export async function createAdminAddedNotifications(
	userIdTriggeredNotif: string,
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
		notificationTypeToPermMap[NotificationType.ADMIN_UPDATES] as NotificationType,
		newAdminUserIds.concat(userIdTriggeredNotif)
	);

	const notifications: Notification[] = [];

	let message = createNotificationMessage(NotificationType.YOU_WERE_ADDED_AS_ADMIN);
	let pushNotificationPayload = {
		title: notificationTypeToSubject[NotificationType.YOU_WERE_ADDED_AS_ADMIN],
		body: message
	};

	for (const newAdminUserId of newAdminUserIds) {
		notifications.push(
			new Notification(
				eventId,
				newAdminUserId,
				message,
				NotificationType.YOU_WERE_ADDED_AS_ADMIN,
				[newAdminUserId],
				new Set([newAdminUserId]),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly = false
			)
		);
	}

	message = createNotificationMessage(NotificationType.ADMIN_ADDED);
	pushNotificationPayload = {
		title: notificationTypeToSubject[NotificationType.ADMIN_ADDED],
		body: message
	};

	// Create notifications for granted users
	for (const userId of granted) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.ADMIN_ADDED,
				newAdminUserIds,
				new Set(newAdminUserIds),
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
				newAdminUserIds,
				new Set(newAdminUserIds),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				true // isInAppOnly = true
			)
		);
	}

	return notifications;
}

export async function createNewMessageNotifications(
	userIdTriggeredNotif: string,
	eventId: string,
	newMessageId: string
): Promise<Notification[]> {
	if (!newMessageId) return [];

	const { granted: attendingUserIdsGranted, notGranted: attendingUserIdsNotGranted } =
		await getAttendeeUserIdsOfEvent(
			eventId,
			NOTIFY_OF_ATTENDING_STATUS_CHANGE,
			notificationTypeToPermMap[NotificationType.NEW_MESSAGE] as NotificationType,
			[userIdTriggeredNotif]
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

	const numObjects = 1; // Since it's a single message
	const message = createNotificationMessage(NotificationType.NEW_MESSAGE, numObjects);
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
				new Set([newMessageId]),
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
				new Set([newMessageId]),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				true // isInAppOnly = true
			)
		);
	}

	return notifications;
}

export async function createEventInvitationNotifications(
	userIdTriggeredNotif: string,
	eventId: string,
	invitedUserIds: string[]
): Promise<Notification[]> {
	if (!invitedUserIds.length) return [];

	// Get event details for the invitation message
	const eventQuery = triplitHttpClient
		.query('events')
		.Select(['title', 'user_id'])
		.Where([['id', '=', eventId]]);
	const [event] = await triplitHttpClient.fetch(eventQuery);

	if (!event) return [];

	const message = createNotificationMessage(NotificationType.EVENT_INVITATION, 1);
	const pushNotificationPayload = {
		title: `Invitation to ${event.title}`,
		body: message
	};

	const notifications: Notification[] = [];

	// Create notifications for each invited user
	for (const userId of invitedUserIds) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.EVENT_INVITATION,
				[eventId], // Use event ID as the object ID
				new Set([eventId]),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly = false (send to all channels)
			)
		);
	}

	return notifications;
}

export async function createEventCancelledNotifications(
	userIdTriggeredNotif: string,
	eventId: string,
	attendeeIds: string[]
): Promise<Notification[]> {
	if (!attendeeIds.length) return [];

	// Get event details for the notification message
	const eventDetails = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('events')
			.Where([['id', '=', eventId]])
			.Select(['title'])
	);

	const eventTitle = eventDetails?.[0]?.title || 'Event';
	const message = `❌ Event "${eventTitle}" has been cancelled`;
	const pushNotificationPayload = {
		title: 'Event Cancelled',
		body: message
	};

	const notifications: Notification[] = [];

	// Create notifications for each attendee (they all get the same message)
	for (const attendeeId of attendeeIds) {
		notifications.push(
			new Notification(
				eventId,
				attendeeId,
				message,
				NotificationType.EVENT_CANCELLED,
				[eventId], // Use event ID as the object ID
				new Set([eventId]),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly = false (send to all channels)
			)
		);
	}

	return notifications;
}

export async function createEventDeletedNotifications(
	userIdTriggeredNotif: string,
	eventId: string,
	attendeeIds: string[]
): Promise<Notification[]> {
	if (!attendeeIds.length) return [];

	// Get event details for the notification message
	const eventDetails = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('events')
			.Where([['id', '=', eventId]])
			.Select(['title'])
	);

	const eventTitle = eventDetails?.[0]?.title || 'Event';
	const message = `🗑️ Event "${eventTitle}" has been deleted`;
	const pushNotificationPayload = {
		title: 'Event Deleted',
		body: message
	};

	const notifications: Notification[] = [];

	// Create notifications for each attendee (they all get the same message)
	for (const attendeeId of attendeeIds) {
		notifications.push(
			new Notification(
				eventId,
				attendeeId,
				message,
				NotificationType.EVENT_DELETED,
				[eventId], // Use event ID as the object ID
				new Set([eventId]),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly = false (send to all channels)
			)
		);
	}

	return notifications;
}

export async function createSupportMessageNotifications(
	senderUserId: string,
	supportMessageId: string
): Promise<Notification[]> {
	if (!supportMessageId) return [];

	// Get all users with admin privileges
	const adminUsers = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('user_personal_data')
			.Where([['is_event_styles_admin', '=', true]])
			.Select(['user_id', 'username'])
	);

	if (!adminUsers.length) return [];

	// Get sender details for the notification message
	const senderQuery = triplitHttpClient
		.query('user_personal_data')
		.Select(['username'])
		.Where([['user_id', '=', senderUserId]]);
	const [sender] = await triplitHttpClient.fetch(senderQuery);

	const senderName = sender?.username || 'Unknown User';
	const message = `🆘 New support message from ${senderName}`;
	const pushNotificationPayload = {
		title: 'New Support Message',
		body: message
	};

	const notifications: Notification[] = [];

	// Create notifications for all admin users
	for (const adminUser of adminUsers) {
		// Don't notify the sender if they're also an admin
		if (adminUser.user_id === senderUserId) continue;

		notifications.push(
			new Notification(
				null, // Support messages don't belong to specific events
				adminUser.user_id,
				message,
				NotificationType.SUPPORT_MESSAGE,
				[supportMessageId],
				new Set([supportMessageId]),
				pushNotificationPayload,
				[], // No special permissions required for support notifications
				false // isInAppOnly = false (send to all channels)
			)
		);
	}

	return notifications;
}

export async function createUnseenInvitationsNotifications(
	adminUserId: string,
	eventId: string,
	attendeeIds: string[]
): Promise<Notification[]> {
	if (!attendeeIds.length) return [];

	// Only send to admins of the event
	const { granted } = await getAdminUserIdsOfEvent(
		eventId,
		notificationTypeToPermMap[NotificationType.ADMIN_UPDATES] as NotificationType,
		[adminUserId] // Exclude the admin who triggered this notification if they're in the list
	);

	if (!granted.length) return [];

	const numObjects = attendeeIds.length;
	const message = createNotificationMessage(NotificationType.UNSEEN_INVITATIONS, numObjects);
	const pushNotificationPayload = {
		title: 'Unseen Invitations',
		body: message
	};

	const notifications: Notification[] = [];

	// Create notifications for admin users
	for (const userId of granted) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.UNSEEN_INVITATIONS,
				attendeeIds,
				new Set(attendeeIds),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly = false
			)
		);
	}

	return notifications;
}

export async function createUnseenAnnouncementsNotifications(
	adminUserId: string,
	eventId: string,
	attendeeIds: string[]
): Promise<Notification[]> {
	if (!attendeeIds.length) return [];

	// Only send to admins of the event
	const { granted } = await getAdminUserIdsOfEvent(
		eventId,
		notificationTypeToPermMap[NotificationType.ADMIN_UPDATES] as NotificationType,
		[adminUserId] // Exclude the admin who triggered this notification if they're in the list
	);

	if (!granted.length) return [];

	const numObjects = attendeeIds.length;
	const message = createNotificationMessage(NotificationType.UNSEEN_ANNOUNCEMENTS, numObjects);
	const pushNotificationPayload = {
		title: 'Unseen Announcements',
		body: message
	};

	const notifications: Notification[] = [];

	// Create notifications for admin users
	for (const userId of granted) {
		notifications.push(
			new Notification(
				eventId,
				userId,
				message,
				NotificationType.UNSEEN_ANNOUNCEMENTS,
				attendeeIds,
				new Set(attendeeIds),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly = false
			)
		);
	}

	return notifications;
}
