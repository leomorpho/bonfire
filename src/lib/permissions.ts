import { HttpClient, or, type Models, type WhereFilter } from '@triplit/client';
import type { PermissionsArray } from './types';
import { DeliveryPermissions, NotificationPermissions } from './enums';

export async function toggleNotificationPermission(
	client: HttpClient | null | undefined,
	userId: string,
	permissionType: keyof typeof NotificationPermissions,
	granted: boolean,
	eventId: string | null = null
) {
	await toggleSettingsPermission(
		client,
		userId,
		permissionType,
		granted,
		'notification_permissions',
		eventId
	);
}

export async function toggleDeliveryPermission(
	client: HttpClient | null | undefined,
	userId: string,
	permissionType: keyof typeof DeliveryPermissions,
	granted: boolean,
	eventId: string | null = null
) {
	await toggleSettingsPermission(
		client,
		userId,
		permissionType,
		granted,
		'delivery_permissions',
		eventId
	);
}

export async function toggleSettingsPermission(
	client: HttpClient | null | undefined,
	userId: string,
	permissionType: string,
	granted: boolean,
	modelName: string,
	eventId: string | null = null
) {
	try {
		if (!client) {
			return;
		}
		let id = permissionType + '_' + userId;
		if (eventId) {
			id = id + `_${eventId}`;
		}

		const perm = await client.fetchById(modelName, id);

		if (perm) {
			// Update existing permission
			await client.update(modelName, perm.id, (o) => {
				o.granted = granted;
			});
		} else {
			// Create new permission if it doesn't exist
			return await client.insert(modelName, {
				id: id,
				user_id: userId,
				permission: permissionType,
				granted: granted,
				event_id: eventId
			});
		}
	} catch (error) {
		console.error('An error occurred while updating the permission.', error);
	}
}

export const getPermissionFiltersForEventAndPermissionType = (eventId: string | null = null) => {
	let eventIdFilter: Array<WhereFilter<Models, string>> = [['event_id', 'isDefined', false]];

	if (eventId) {
		eventIdFilter = [...eventIdFilter, ['event_id', '=', eventId]];
	}
	return or(eventIdFilter);
};

export const getEffectivePermissionSettingForEvent = (permissions: PermissionsArray): boolean => {
	// Find the permission with an event_id set
	const eventSpecificPermission = permissions.find((perm) => perm.event_id !== undefined);

	// If an event-specific permission is found, return its granted status and id
	if (eventSpecificPermission) {
		return eventSpecificPermission.granted;
	}

	// If no event-specific permission is found, return the granted status and id of the general permission
	const generalPermission = permissions.find((perm) => perm.event_id === undefined);

	// Return the granted status and id of the general permission, or default values if none is found
	return generalPermission ? generalPermission.granted : false;
};

/**
 * Checks if at least one permission type is effectively granted, considering
 * event-specific permissions overriding general ones.
 * @param permissions - Array of permission objects.
 * @returns True if at least one permission type is effectively granted, otherwise false.
 */
export const hasAnyEffectivePermissionGranted = (permissions: PermissionsArray): boolean => {
	// Create a set of unique permission types
	const permissionTypes = new Set(permissions.map((perm) => perm.permission));

	// Iterate over each permission type
	for (const type of permissionTypes) {
		// Find the event-specific permission for this type
		const eventSpecificPermission = permissions.find(
			(perm) => perm.permission === type && perm.event_id !== undefined
		);

		// If an event-specific permission is found, check its granted status
		if (eventSpecificPermission) {
			if (eventSpecificPermission.granted) {
				return true; // Event-specific permission is granted
			}
		} else {
			// Otherwise, find the general permission for this type
			const generalPermission = permissions.find(
				(perm) => perm.permission === type && perm.event_id === undefined
			);

			// Check the granted status of the general permission
			if (generalPermission && generalPermission.granted) {
				return true; // General permission is granted
			}
		}
	}

	return false; // No permissions are effectively granted
};
