import type { HttpClient } from '@triplit/client';
import type { WorkerClient } from '@triplit/client/worker-client';

/**
 * Create a new bring item (only admins can do this).
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} eventId - The event ID.
 * @param {string} userId - The admin creating the item.
 * @param {string} name - The item name (e.g., "Coca Cola").
 * @param {string} unit - The unit ("per_person" or "count").
 * @param {number} quantityNeeded - The total quantity needed.
 * @returns {Promise<object>} - The newly created bring item.
 */
export async function createBringItem(
	client: WorkerClient | HttpClient,
	eventId: string,
	userId: string,
	name: string,
	unit: string,
	quantityNeeded: number,
	details: string,
): Promise<object> {
	const output = await client.insert('bring_items', {
		event_id: eventId,
		name,
		unit,
		quantity_needed: quantityNeeded,
		created_by_user_id: userId,
		created_at: new Date().toISOString(),
		details: details
	});

	return output;
}

/**
 * Update a bring item (only admins can do this).
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} itemId - The bring item ID.
 * @param {string} userId - The admin updating the item.
 * @param {Partial<{ name: string; unit: 'per_person' | 'count'; quantity_needed: number }>} updates - Fields to update.
 * @returns {Promise<object>} - The updated bring item.
 */
export async function updateBringItem(
	client: WorkerClient,
	itemId: string,
	updates: Partial<{
		name: string;
		unit: string;
		quantity_needed: number;
		details: string;
	}>
): Promise<object> {
	// Ensure the user is an admin
	const item = await client.fetchOne(client.query('bring_items').Where([['id', '=', itemId]]));
	if (!item) throw new Error('Item not found');

	const updatedItem = await client.update('bring_items', itemId, (item) => {
		Object.assign(item, updates);
	});

	return updatedItem;
}

/**
 * Delete a bring item (only admins can do this).
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} itemId - The bring item ID.
 * @param {string} userId - The admin deleting the item.
 * @returns {Promise<void>}
 */
export async function deleteBringItemAndAssignments(
	client: WorkerClient,
	itemId: string
): Promise<void> {
	try {
		// Fetch all related bring_assignments
		const assignments = await client.fetch(
			client.query('bring_assignments').Where([['bring_item_id', '=', itemId]])
		);

		// Delete each assignment
		for (const assignment of assignments) {
			await client.delete('bring_assignments', assignment.id);
		}

		// Delete the bring_item
		await client.delete('bring_items', itemId);

		console.log('Bring item and related assignments deleted successfully.');
	} catch (error) {
		console.error('Error deleting bring item and assignments:', error);
	}
}

/**
 * Assign a bring item to a user (admins can assign to others, users can assign to themselves).
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} itemId - The bring item ID.
 * @param {string} assignedToUserId - The user who is assigned the item.
 * @param {string} assignedByUserId - The user making the assignment (can be the same as assignedToUserId).
 * @param {number} quantity - The quantity assigned.
 * @returns {Promise<object>} - The newly created assignment.
 */
export async function assignBringItem(
	client: WorkerClient | HttpClient,
	itemId: string,
	assignedToUserId: string | null,
	assignedToTempUserId: string | null,
	assignedByUserId: string | null,
	quantity: number
): Promise<object> {
	if (!assignedToUserId && !assignedToTempUserId) {
		throw new Error('bring item must be assigned to a user or a temp user');
	}
	// Ensure the item exists
	const item = await client.fetchOne(client.query('bring_items').Where([['id', '=', itemId]]));
	if (!item) throw new Error('Item not found');

	const output = await client.insert('bring_assignments', {
		bring_item_id: itemId,
		assigned_to_user_id: assignedToUserId,
		assigned_to_temp_attendee_id: assignedToTempUserId,
		assigned_by_user_id: assignedByUserId,
		quantity,
		created_at: new Date().toISOString()
	});

	return output;
}

/**
 * Update an assignment (only the assignee or an admin can do this).
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} assignmentId - The bring assignment ID.
 * @param {string} userId - The user updating the assignment.
 * @param {Partial<{ quantity: number }>} updates - Fields to update.
 * @returns {Promise<object>} - The updated assignment.
 */
export async function updateBringAssignment(
	client: WorkerClient,
	assignmentId: string,
	updates: Partial<{ quantity: number }>
): Promise<object> {
	// Ensure the assignment exists
	const assignment = await client.fetchOne(
		client.query('bring_assignments').Where([['id', '=', assignmentId]])
	);
	if (!assignment) throw new Error('Assignment not found');

	const updatedAssignment = await client.update('bring_assignments', assignmentId, (assignment) => {
		Object.assign(assignment, updates);
	});

	return updatedAssignment;
}

/**
 * Delete an assignment (only the assignee or an admin can do this).
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} assignmentId - The bring assignment ID.
 * @param {string} userId - The user deleting the assignment.
 * @returns {Promise<void>}
 */
export async function deleteBringAssignment(
	client: WorkerClient,
	assignmentId: string
): Promise<void> {
	// Ensure the assignment exists
	const assignment = await client.fetchOne(
		client.query('bring_assignments').Where([['id', '=', assignmentId]])
	);
	if (!assignment) throw new Error('Assignment not found');

	await client.delete('bring_assignments', assignmentId);
}
