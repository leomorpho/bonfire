import type { NotificationType, NotificationPermissions } from '$lib/enums';
import type { PushNotificationPayload } from '$lib/types';

export type PermissionValue =
	(typeof NotificationPermissions)[keyof typeof NotificationPermissions];

export class Notification {
	eventId: string | null;
	userId: string;
	message: string;
	objectType: NotificationType;
	objectIds: string[];
	objectIdsSet: Set<string>;
	pushNotificationPayload: PushNotificationPayload;
	requiredPermissions: PermissionValue[];
	isInAppOnly: boolean;

	constructor(
		eventId: string | null,
		userId: string,
		message: string,
		objectType: NotificationType,
		objectIds: string[],
		objectIdsSet: Set<string>,
		pushNotificationPayload: PushNotificationPayload,
		requiredPermissions: PermissionValue[],
		isInAppOnly: boolean = false
	) {
		this.eventId = eventId;
		this.userId = userId;
		this.message = message;
		this.objectType = objectType;
		this.objectIds = objectIds;
		this.objectIdsSet = objectIdsSet;
		this.pushNotificationPayload = pushNotificationPayload;
		this.requiredPermissions = requiredPermissions;
		this.isInAppOnly = isInAppOnly;
	}
}