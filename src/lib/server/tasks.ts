import type { TaskName } from '$lib/enums';
import { triplitHttpClient } from './triplit';

/**
 * Retrieves the lock state of a specific task.
 * @param {string} taskName - The name of the task.
 * @returns {Promise<{ locked: boolean } | null>} - The lock state of the task or null if the task is not found.
 */
export async function getTaskLockState(taskName: TaskName) {
	return await triplitHttpClient.fetchById('task_locks', taskName);
}

/**
 * Updates or inserts the lock state of a specific task.
 * @param {string} taskName - The name of the task.
 * @param {boolean} locked - The new lock state to set.
 * @returns {Promise<void>} - Resolves when the lock state is successfully updated or inserted.
 */
export async function updateTaskLockState(taskName: TaskName, locked: boolean) {
	await triplitHttpClient.insert('task_locks', {
		id: taskName,
		locked,
		updated_at: new Date()
	});
}

/**
 * Unlocks all tasks by setting their lock state to false.
 * @returns {Promise<void>} - Resolves when all tasks are successfully unlocked.
 */
export async function unlockAllTasks() {
	const tasks = await triplitHttpClient.fetch(triplitHttpClient.query('task_locks').Select(['id']));

	for (const task of tasks) {
		await updateTaskLockState(task.id as TaskName, false);
	}
}
