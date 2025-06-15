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
export const percentProfitsToCharity = 25;

// Usage for tempAttendeeSecretStore
export const tempAttendeeSecretStore = createPersistentStore<string | null>('tempAttendeeId', null);

export const tempAttendeeSecretParam = 'temp-secret';
export const tempAttendeeIdInForm = 'tempAttendeeIdInForm';

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
	INVITED = 'invited',
	DEFAULT = 'RSVP'
}

export enum EventStatus {
	ACTIVE = 'active',
	CANCELLED = 'cancelled'
}

export enum TaskName {
	PROCESS_NOTIFICATION_QUEUE = 'process_notification_queue',
	SEND_REMINDER_NOTIFICATIONS = 'send_reminder_notifications',
	FREE_LOGS_REWARDS = 'free_logs_rewards'
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

export const MAX_NUM_PUSH_NOTIF_PER_NOTIFICATION = 3;

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
	PROFILE_PHOTO: 'profile_photo',
	ORGANIZATION_COVER_PHOTO: 'organization_cover_photo'
};

export const TransactionType = {
	PURCHASE: 'purchase',
	AWARD: 'award',
	REFUND: 'refund',
	BONFIRE_HOSTED: 'bonfire_hosted',
	DONATION: 'donation'
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

export enum NotificationType {
	OTP_VERIFICATION = 'otp',
	ANNOUNCEMENT = 'announcement',
	FILES = 'files',
	ATTENDEES = 'attendees',
	TEMP_ATTENDEES = 'temp_attendees',
	ADMIN_ADDED = 'admin_added',
	YOU_WERE_ADDED_AS_ADMIN = 'you_were_added_as_admin',
	NEW_MESSAGE = 'new_message',
	REMINDER = 'reminder',
	ADMIN_UPDATES = 'admin_updates',
	EVENT_INVITATION = 'event_invitation',
	EVENT_CANCELLED = 'event_cancelled',
	EVENT_DELETED = 'event_deleted',
	SUPPORT_MESSAGE = 'support_message',
	TICKET_PURCHASED = 'ticket_purchased'
}

export const NotificationPermissions = {
	event_reminders: 'event_reminders',
	event_activity: 'event_activity',
	event_files_uploaded: 'event_files_uploaded',
	event_messages: 'event_messages'
};

export const DeliveryPermissions = {
	push_notifications: 'push_notifications',
	sms_notifications: 'sms_notifications',
	email_notifications: 'email_notifications'
};

export const notificationTypeToPermMap: {
	[key in NotificationType]:
		| (typeof NotificationPermissions)[keyof typeof NotificationPermissions]
		| null;
} = {
	[NotificationType.ANNOUNCEMENT]: NotificationPermissions.event_activity,
	[NotificationType.FILES]: NotificationPermissions.event_files_uploaded,
	[NotificationType.ATTENDEES]: NotificationPermissions.event_activity,
	[NotificationType.TEMP_ATTENDEES]: NotificationPermissions.event_activity,
	[NotificationType.YOU_WERE_ADDED_AS_ADMIN]: NotificationPermissions.event_activity,
	[NotificationType.ADMIN_ADDED]: NotificationPermissions.event_activity,
	[NotificationType.NEW_MESSAGE]: NotificationPermissions.event_messages,
	[NotificationType.REMINDER]: NotificationPermissions.event_activity,
	[NotificationType.OTP_VERIFICATION]: null,
	[NotificationType.ADMIN_UPDATES]: NotificationPermissions.event_activity,
	[NotificationType.EVENT_INVITATION]: NotificationPermissions.event_activity,
	[NotificationType.EVENT_CANCELLED]: NotificationPermissions.event_activity,
	[NotificationType.EVENT_DELETED]: NotificationPermissions.event_activity,
	[NotificationType.SUPPORT_MESSAGE]: null, // Support messages don't require user permission
	[NotificationType.TICKET_PURCHASED]: NotificationPermissions.event_activity
};

export const notificationTypesNoRateLimit = new Set([NotificationPermissions.event_reminders]);

// Define the mapping of notification types to delivery types
export const notificationTypeToDeliveryMap: {
	[key in NotificationType]: (typeof DeliveryPermissions)[keyof typeof DeliveryPermissions][];
} = {
	[NotificationType.ANNOUNCEMENT]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
		// DeliveryPermissions.sms_notifications
	],
	[NotificationType.FILES]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
	],
	[NotificationType.ATTENDEES]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
	],
	[NotificationType.TEMP_ATTENDEES]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
	],
	[NotificationType.YOU_WERE_ADDED_AS_ADMIN]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
	],
	[NotificationType.ADMIN_ADDED]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
	],
	[NotificationType.NEW_MESSAGE]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
		// DeliveryPermissions.sms_notifications
	],
	[NotificationType.REMINDER]: [
		DeliveryPermissions.push_notifications,
		// DeliveryPermissions.sms_notifications,
		DeliveryPermissions.email_notifications
	],
	[NotificationType.OTP_VERIFICATION]: [],
	[NotificationType.ADMIN_UPDATES]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
	],
	[NotificationType.EVENT_INVITATION]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications,
		DeliveryPermissions.sms_notifications
	],
	[NotificationType.EVENT_CANCELLED]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications,
		DeliveryPermissions.sms_notifications
	],
	[NotificationType.EVENT_DELETED]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications,
		DeliveryPermissions.sms_notifications
	],
	[NotificationType.SUPPORT_MESSAGE]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
	],
	[NotificationType.TICKET_PURCHASED]: [
		DeliveryPermissions.push_notifications,
		DeliveryPermissions.email_notifications
	]
};

// Define a set of notification types that support flattening
export const flattenableNotificationTypes = new Set([
	NotificationType.ANNOUNCEMENT,
	NotificationType.FILES,
	NotificationType.NEW_MESSAGE,
	NotificationType.TEMP_ATTENDEES,
	NotificationType.ATTENDEES
]);

// Define the mapping of notification types to email subjects
export const notificationTypeToSubject: { [key in NotificationType]: string } = {
	[NotificationType.ANNOUNCEMENT]: 'New Event Announcement!',
	[NotificationType.FILES]: 'New Media Files Uploaded',
	[NotificationType.ATTENDEES]: 'New Attendees Joined!',
	[NotificationType.TEMP_ATTENDEES]: 'New Temporary Attendees Added',
	[NotificationType.YOU_WERE_ADDED_AS_ADMIN]: 'You’re Now an Admin!',
	[NotificationType.ADMIN_ADDED]: 'New Admin',
	[NotificationType.NEW_MESSAGE]: 'New Event Messages!',
	[NotificationType.REMINDER]: 'Event Reminder!',
	[NotificationType.OTP_VERIFICATION]: '',
	[NotificationType.ADMIN_UPDATES]: 'Event Update!',
	[NotificationType.EVENT_INVITATION]: "You're Invited to an Event!",
	[NotificationType.EVENT_CANCELLED]: 'Event Cancelled',
	[NotificationType.EVENT_DELETED]: 'Event Deleted',
	[NotificationType.SUPPORT_MESSAGE]: 'New Support Message',
	[NotificationType.TICKET_PURCHASED]: 'Ticket Purchase Confirmation'
};

type NotificationTypeMapping = {
	[key in NotificationType]: {
		singularObjectName: string;
		pluralObjectName: string;
	};
};

export const notificationTypeMapping: NotificationTypeMapping = {
	[NotificationType.ANNOUNCEMENT]: {
		singularObjectName: 'announcement',
		pluralObjectName: 'announcements'
	},
	[NotificationType.FILES]: {
		singularObjectName: 'media file',
		pluralObjectName: 'media files'
	},
	[NotificationType.NEW_MESSAGE]: {
		singularObjectName: 'message',
		pluralObjectName: 'messages'
	},
	[NotificationType.ATTENDEES]: {
		singularObjectName: 'attendee',
		pluralObjectName: 'attendees'
	},
	[NotificationType.TEMP_ATTENDEES]: {
		singularObjectName: 'temporary account attendee',
		pluralObjectName: 'temporary account attendees'
	},
	[NotificationType.YOU_WERE_ADDED_AS_ADMIN]: {
		singularObjectName: 'admin',
		pluralObjectName: 'admins'
	},
	[NotificationType.ADMIN_ADDED]: {
		singularObjectName: 'admin',
		pluralObjectName: 'admins'
	},
	[NotificationType.ADMIN_UPDATES]: {
		singularObjectName: 'admin',
		pluralObjectName: 'admins'
	},
	[NotificationType.REMINDER]: {
		singularObjectName: 'reminder',
		pluralObjectName: 'reminders'
	},
	[NotificationType.EVENT_INVITATION]: {
		singularObjectName: 'invitation',
		pluralObjectName: 'invitations'
	},
	[NotificationType.EVENT_CANCELLED]: {
		singularObjectName: 'cancellation',
		pluralObjectName: 'cancellations'
	},
	[NotificationType.EVENT_DELETED]: {
		singularObjectName: 'deletion',
		pluralObjectName: 'deletions'
	},
	[NotificationType.OTP_VERIFICATION]: {
		singularObjectName: 'verification',
		pluralObjectName: 'verifications'
	},
	[NotificationType.SUPPORT_MESSAGE]: {
		singularObjectName: 'support message',
		pluralObjectName: 'support messages'
	},
	[NotificationType.TICKET_PURCHASED]: {
		singularObjectName: 'ticket purchase',
		pluralObjectName: 'ticket purchases'
	}
	// Add other notification types as needed
};

// TODO: technically 160 but don't wanna deal with counting unicode chars correctly for now, see TexAreaAutoGrow
export const maxSmsLenInChars = 100;
export const defaultMaxEventCapacity = null;
export const defaultMaxNumGuestsPerAttendee = 2;

export enum eventInputTypes {
	textarea = 'textarea',
	date = 'date',
	eventdetails = 'eventdetails',
	text = 'text',
	address = 'address'
}

export const mainDemoEventId = 'the-coolest-demo-event';

// Allowed currencies for events (subset of what Stripe supports)
export const ALLOWED_EVENT_CURRENCIES = [
	'usd', // US Dollar
	'eur', // Euro
	'gbp', // British Pound
	'cad', // Canadian Dollar
	'aud', // Australian Dollar
	'jpy', // Japanese Yen
	'cny', // Chinese Yuan
	'inr', // Indian Rupee
	'mxn', // Mexican Peso
	'brl', // Brazilian Real
	'krw', // South Korean Won
	'sgd', // Singapore Dollar
	'hkd', // Hong Kong Dollar
	'nzd', // New Zealand Dollar
	'chf', // Swiss Franc
	'sek', // Swedish Krona
	'nok', // Norwegian Krone
	'dkk', // Danish Krone
	'aed', // UAE Dirham
	'zar' // South African Rand
] as const;

export type AllowedCurrency = (typeof ALLOWED_EVENT_CURRENCIES)[number];

// Define an enum for platform and browser types
export enum PlatformBrowser {
	IOS_SAFARI,
	IOS_OTHER,
	ANDROID_CHROME,
	ANDROID_FIREFOX,
	ANDROID_SAFARI,
	ANDROID_EDGE,
	ANDROID_OTHER,
	DESKTOP_CHROME,
	DESKTOP_FIREFOX,
	DESKTOP_SAFARI,
	DESKTOP_EDGE,
	DESKTOP_OTHER,
	UNSUPPORTED
}

export enum EventCreationStep {
	EventDate = 1,
	DateAndTime = 2,
	FindDate = 3,
	EventName = 4,
	Address = 5,
	LimitCapacity = 6,
	CapacityLimit = 7,
	BringList = 8,
	ForceBringSomething = 9,
	AllowGuests = 10,
	GuestsPerAttendee = 11,
	Completion = 12
}

export enum BonfireTabs {
	About = 'about',
	Discussions = 'discussions',
	UserSettings = 'user-settings',
	History = 'history'
}

export enum BonfireEditingTabs {
	Info = 'info',
	Styles = 'styles',
	Admins = 'admins',
	Reminders = 'reminders',
	Tickets = 'tickets'
}

export enum QuestionnaireStep {
	Gender = 1,
	Location,
	HighestLevelOfEducation,
	Industry,
	Birthday,
	RelationshipStatus,
	HasChildren,
	PrimaryReasonForUsingApp,
	IntroversionLevel,
	CreativityLevel,
	ImportanceOfEducation,
	AdventurousLevel,
	ReceiveNotifications,
	AgreeToTerms,
	HowDidYouHearAboutUs,
	Completion
}
