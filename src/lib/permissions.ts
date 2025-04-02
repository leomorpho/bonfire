import type { TriplitClient } from '@triplit/client';

export async function togglePermission(
	client: TriplitClient | null | undefined,
	userId: string,
	permissionId: string | null,
	permissionType: string,
	granted: boolean
) {
	try {
		if (!client) {
			return;
		}
		if (permissionId) {
			// Update existing permission
			await client.update('delivery_permissions', permissionId, (o) => {
				o.granted = granted;
			});
		} else {
			// Create new permission if it doesn't exist
			return await client.insert('delivery_permissions', {
				id: permissionType + '_' + userId,
				user_id: userId,
				permission: permissionType,
				granted: granted
			});
		}
	} catch (error) {
		console.error('An error occurred while updating the permission.', error);
	}
}
