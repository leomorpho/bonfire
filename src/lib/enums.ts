import { writable } from 'svelte/store';

export const tempAttendeeIdStore = writable<string | null>(null);
export const tempAttendeeIdUrlParam = 'temp-attendee-id';

export const TEMP_ATTENDEE_MIN_NAME_LEN = 2;

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
	ATTENDEES = 'attendees'
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