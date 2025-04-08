import type { TriplitClient } from '@triplit/client';

export async function togglePermission(
	client: TriplitClient | null | undefined,
	userId: string,
	permissionId: string | null,
	permissionType: string,
	granted: boolean,
	eventId: string | null = null
) {
	try {
		if (!client) {
			return;
		}
		if (permissionId) {
			// Update existing permission
			await client.http.update('delivery_permissions', permissionId, (o) => {
				o.granted = granted;
			});
		} else {
			let id = permissionType + '_' + userId;
			if (eventId) {
				id = id + `_${eventId}`;
			}
			// Create new permission if it doesn't exist
			return await client.http.insert('delivery_permissions', {
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
