import { or, type Models, type TriplitClient, type WhereFilter } from '@triplit/client';
import type { PermissionsArray } from './types';

export async function toggleSettingsPermission(
	client: TriplitClient | null | undefined,
	userId: string,
	permissionType: string,
	granted: boolean,
	modelName:string,
	eventId: string | null = null,
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
			await client.http.update(modelName, perm.id, (o) => {
				o.granted = granted;
			});
		} else {
			// Create new permission if it doesn't exist
			return await client.http.insert(modelName, {
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
