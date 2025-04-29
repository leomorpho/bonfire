import type { TaskName } from '$lib/enums';
import { addMinutes } from 'date-fns';
import { triplitHttpClient } from './triplit';
import { isWithinExpirationDate } from '$lib/utils';

const LOCK_TIMEOUT_MINUTES = 1;

/**
 * Retrieves the lock state of a specific task.
 * @param {string} taskName - The name of the task.
 * @returns {Promise<{ locked: boolean } | null>} - The lock state of the task or null if the task is not found.
 */
export async function getTaskLockState(taskName: TaskName): Promise<boolean> {
	const lock = await triplitHttpClient.fetchById('task_locks', taskName);

	if (lock && lock.updated_at instanceof Date) {
		const expirationDate = addMinutes(lock.updated_at, LOCK_TIMEOUT_MINUTES);
		if (!isWithinExpirationDate(expirationDate)) {
			console.warn(`Lock for task ${taskName} has timed out. Releasing the lock.`);
			await updateTaskLockState(taskName, false);
			return false;
		}
		return lock.locked;
	}
	return false;
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
