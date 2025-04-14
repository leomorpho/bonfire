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

export enum UserTypes {
	USER = 'user',
	TEMP = 'temp',
	ANON = 'anon'
}

export enum Status {
	GOING = 'going',
	NOT_GOING = 'not_going',
	MAYBE = 'maybe',
	LEFT = 'left',
	REMOVED = 'removed',
	WAITLIST = 'waitlisted', // TODO: not yet in effect
	DEFAULT = 'RSVP'
}

export enum TaskName {
	PROCESS_NOTIFICATION_QUEUE = 'process_notification_queue',
	SEND_REMINDER_NOTIFICATIONS = 'send_reminder_notifications'
}

export enum EventFormType {
	CREATE = 'create',
	UPDATE = 'update'
}

export const LOGIN_TYPE_MAGIC_LINK = 'magic';
export const LOGIN_TYPE_ACTIVATION = 'activation';
export const NOTIFY_OF_ATTENDING_STATUS_CHANGE: Array<Status> = [Status.GOING, Status.MAYBE];
export const NUM_DEFAULT_LOGS_NEW_SIGNUP = 3;
export const NUM_LOGS_SPENT_PER_BONFIRE_EVENT = 1;

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

// TODO: deprecate in favor of NotificationPermissions
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

export const EMOJI_REACTION_TYPE = {
	MESSAGE: 'message'
};

export const BringListCountTypes = {
	PER_PERSON: 'per_person',
	COUNT: 'count'
};

export const UploadFileTypes = {
	GALLERY: 'gallery',
	BONFIRE_COVER_PHOTO: 'bonfire_cover_photo',
	PROFILE_PHOTO: 'profile_photo'
};

export const TransactionType = {
	PURCHASE: 'purchase',
	REFUND: 'refund',
	BONFIRE_HOSTED: 'bonfire_hosted'
};
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const ABS_MAX_GUEST_NUM = 6;

export const HistoryChangesConstants = {
	user_id: 'user_id',
	temporary_attendee_id: 'temporary_attendee_id',
	field_name_status: 'status',
	field_name_num_guests: 'num_guests',
	change_create: 'create',
	change_delete: 'delete',
	change_update: 'update'
};

export const NotificationPermissions = {
	primary_reminder: 'primary_reminder',
	secondary_reminder: 'secondary_reminder',
	event_activity: 'event_activity'
};

export const DeliveryPermissions = {
	push_notifications: 'push_notifications',
	sms_notifications: 'sms_notifications',
	email_notifications: 'email_notifications'
};

// TODO: technically 160 but don't wanna deal with counting unicode chars correctly for now, see TexAreaAutoGrow
export const maxSmsLenInChars = 100;
export const defaultMaxEventCapacity = 15;
export const defaultMaxNumGuestsPerAttendee = 5;
