import type { TaskName } from '$lib/enums';
import { triplitHttpClient } from './triplit';

export async function getTaskLockState(taskName: TaskName) {
	const result = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('task_locks').where('task_name', '=', taskName).build()
	);
	return result ? result.locked : null;
}

export async function updateTaskLockState(taskName: TaskName, locked: boolean) {
	const existingLock = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('task_locks').where('task_name', '=', taskName).build()
	);

	if (existingLock) {
		await triplitHttpClient.update('task_locks', existingLock.id, async (e) => {
			e.locked = locked;
			e.updated_at = new Date().toISOString();
		});
	} else {
		await triplitHttpClient.insert('task_locks', {
			task_name: taskName,
			locked,
			updated_at: new Date().toISOString()
		});
	}
}

export async function unlockAllTasks() {
	const taskLocks = await triplitHttpClient.fetch(triplitHttpClient.query('task_locks').build());

	for (const taskLock of taskLocks) {
		await triplitHttpClient.insert('task_locks', {
			task_name: taskLock.task_name,
			locked: false,
			updated_at: new Date().toISOString()
		});
	}
}
