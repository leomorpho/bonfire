import { writable, type Writable } from 'svelte/store';

function createPersistentStore<T>(
	key: string,
	initialValue: T
): Writable<T> & { get: () => T | null } {
	const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

	const storedValue = isBrowser ? localStorage.getItem(key) : null;
	const store = writable<T>(storedValue ? (JSON.parse(storedValue) as T) : initialValue);

	// Update localStorage whenever the store value changes
	if (isBrowser) {
		store.subscribe((value) => {
			if (value === null || value === undefined) {
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, JSON.stringify(value));
			}
		});
	}

	return {
		...store,
		set: store.set,
		update: store.update,
		get: () => {
			if (!isBrowser) return null;
			const item = localStorage.getItem(key);
			return item ? (JSON.parse(item) as T) : null;
		}
	};
}

// Usage for tempAttendeeSecretStore
export const tempAttendeeSecretStore = createPersistentStore<string | null>('tempAttendeeId', null);

export const tempAttendeeSecretParam = 'temp-secret';
export const tempAttendeeIdFormName = 'tempAttendeeIdFormName';

export const TEMP_ATTENDEE_MIN_NAME_LEN = 2;
export const MAX_NUM_IMAGES_IN_MINI_GALLERY = 3;

export enum Status {
	GOING = 'going',
	NOT_GOING = 'not_going',
	MAYBE = 'maybe',
	DEFAULT = 'RSVP'
}

export enum TaskName {
	PROCESS_NOTIFICATION_QUEUE = 'process_notification_queue'
}

export enum EventFormType {
	CREATE = 'create',
	UPDATE = 'update'
}

export const LOGIN_TYPE_MAGIC_LINK = 'magic';
export const LOGIN_TYPE_ACTIVATION = 'activation';
export const NOTIFY_OF_ATTENDING_STATUS_CHANGE: Array<Status> = [Status.GOING, Status.MAYBE];
export const NUM_DEFAULT_LOGS_NEW_SIGNUP = 3;

export const getStrValueOfRSVP = (status: string) => {
	switch (status) {
		case Status.GOING:
			return 'Going';
		case Status.NOT_GOING:
			return 'Not going';
		case Status.MAYBE:
			return 'Maybe';
		default:
			return 'RSVP';
	}
};

export enum NotificationType {
	ANNOUNCEMENT = 'announcement',
	FILES = 'files',
	ATTENDEES = 'attendees',
	TEMP_ATTENDEES = 'temp_attendees',
	ADMIN_ADDED = 'admin_added',
	NEW_MESSAGE = 'new_message'
}

export const MAX_NUM_PUSH_NOTIF_PER_NOTIFICATION = 3;

// Define an enum for permission types
export const PermissionType = {
	ONE_DAY_REMINDER: 'oneDayReminder',
	EVENT_ACTIVITY: 'eventActivity'
} as const;

export const TempNameCheckingState = {
	CHECKING: 'CHECKING',
	AVAILABLE: 'AVAILABLE',
	NAME_TAKEN: 'NAME_TAKEN',
	ERROR: 'ERROR'
};

export const LOCAL_INDEXEDDB_NAME = 'bonfire';

export const BannerMediaSize = {
	LARGE_WIDTH: 800,
	LARGE_HEIGHT: 400,
	SMALL_WIDTH: 600,
	SMALL_HEIGHT: 300
};
