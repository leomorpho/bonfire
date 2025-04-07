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

export const Font = {
	Roboto: {
		style: "font-family: 'Roboto', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap'
	},
	Montserrat: {
		style: "font-family: 'Montserrat', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Montserrat&display=swap'
	},
	Lato: {
		style: "font-family: 'Lato', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Lato&display=swap'
	},
	OpenSans: {
		style: "font-family: 'Open Sans', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Open+Sans&display=swap'
	},
	PlayfairDisplay: {
		style: "font-family: 'Playfair Display', serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap'
	},
	Merriweather: {
		style: "font-family: 'Merriweather', serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Merriweather&display=swap'
	},
	Raleway: {
		style: "font-family: 'Raleway', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Raleway&display=swap'
	},
	PTSerif: {
		style: "font-family: 'PT Serif', serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=PT+Serif&display=swap'
	},
	FiraSans: {
		style: "font-family: 'Fira Sans', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Fira+Sans&display=swap'
	},
	Barlow: {
		style: "font-family: 'Barlow', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Barlow&display=swap'
	},
	JetBrainsMonoVariable: {
		style: "font-family: 'JetBrains Mono', monospace;",
		cdn: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap'
	},
	Caveat: {
		style: "font-family: 'Caveat', cursive; font-size: 2.0em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Caveat&display=swap'
	},
	DancingScript: {
		style: "font-family: 'Dancing Script', cursive; font-size: 2.0em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap'
	},
	GrenzeGotischVariable: {
		style: "font-family: 'Grenze Gotisch', system-ui; font-size: 1.5em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Grenze+Gotisch&display=swap'
	},
	RockSalt: {
		style: "font-family: 'Rock Salt', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Rock+Salt&display=swap'
	},
	DotGothic16: {
		style: "font-family: 'DotGothic16', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=DotGothic16&display=swap'
	},
	Exo2: {
		style: "font-family: 'Exo 2', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Exo+2&display=swap'
	},
	Lexend: {
		style: "font-family: 'Lexend', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Lexend&display=swap'
	},
	KronaOne: {
		style: "font-family: 'Krona One', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Krona+One&display=swap'
	},
	Alice: {
		style: "font-family: 'Alice', serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Alice&display=swap'
	},
	InknutAntiqua: {
		style: "font-family: 'Inknut Antiqua', serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Inknut+Antiqua&display=swap'
	},
	PermanentMarker: {
		style: "font-family: 'Permanent Marker', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap'
	},
	VT323: {
		style: "font-family: 'VT323', monospace; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=VT323&display=swap'
	},
	IndieFlower: {
		style: "font-family: 'Indie Flower', cursive; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap'
	},
	ChakraPetch: {
		style: "font-family: 'Chakra Petch', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Chakra+Petch&display=swap'
	},
	CedarvilleCursive: {
		style: "font-family: 'Cedarville Cursive', cursive; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap'
	},
	TwinkleStar: {
		style: "font-family: 'Twinkle Star', cursive; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Twinkle+Star&display=swap'
	},
	SpecialElite: {
		style: "font-family: 'Special Elite', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap'
	},
	Mansalva: {
		style: "font-family: 'Mansalva', cursive; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Mansalva&display=swap'
	},
	Audiowide: {
		style: "font-family: 'Audiowide', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Audiowide&display=swap'
	},
	Handjet: {
		style: "font-family: 'Handjet', cursive; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Handjet&display=swap'
	},
	FingerPaint: {
		style: "font-family: 'Finger Paint', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Finger+Paint&display=swap'
	},
	BerkshireSwash: {
		style: "font-family: 'Berkshire Swash', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Berkshire+Swash&display=swap'
	},
	Tourney: {
		style: "font-family: 'Tourney', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Tourney&display=swap'
	},
	LobsterTwo: {
		style: "font-family: 'Lobster Two', cursive; font-size: 1.7em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Lobster+Two&display=swap'
	},
	FrederickatheGreat: {
		style: "font-family: 'Fredericka the Great', cursive; font-size: 1.4em;", // Adjusted size
		cdn: 'https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap'
	},
	Sacramento: {
		style: "font-family: 'Sacramento', cursive; font-size: 2.0em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Sacramento&display=swap'
	},
	ShadowsIntoLightTwo: {
		style: "font-family: 'Shadows Into Light Two', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Shadows+Into+Light+Two&display=swap'
	},
	Underdog: {
		style: "font-family: 'Underdog', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Underdog&display=swap'
	},
	BungeeTint: {
		style: "font-family: 'Bungee Tint', cursive; font-size: 1.4em;", // Adjusted size
		cdn: 'https://fonts.googleapis.com/css2?family=Bungee+Tint&display=swap'
	},
	Codystar: {
		style: "font-family: 'Codystar', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Codystar&display=swap'
	},
	LibreBaskerville: {
		style: "font-family: 'Libre Baskerville', serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville&display=swap'
	},
	JosefinSans: {
		style: "font-family: 'Josefin Sans', sans-serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Josefin+Sans&display=swap'
	},
	AbrilFatface: {
		style: "font-family: 'Abril Fatface', cursive; font-size: 1.6em;", // Adjusted size
		cdn: 'https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap'
	},
	BigShouldersStencil: {
		style: "font-family: 'Big Shoulders Stencil', cursive; font-size: 1.5em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil&display=swap'
	},
	Orbitron: {
		style: "font-family: 'Orbitron', sans-serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Orbitron&display=swap'
	},
	Righteous: {
		style: "font-family: 'Righteous', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Righteous&display=swap'
	},
	// AmaticSC: {
	// 	style: "font-family: 'Amatic SC', cursive; font-size: 1.8em;", // Adjusted size
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Amatic+SC&display=swap'
	// },
	RubikMonoOne: {
		style: "font-family: 'Rubik Mono One', monospace; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Rubik+Mono+One&display=swap'
	},
	YanoneKaffeesatz: {
		style: "font-family: 'Yanone Kaffeesatz', sans-serif; font-size: 1.7em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Yanone+Kaffeesatz&display=swap'
	},
	Prata: {
		style: "font-family: 'Prata', serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Prata&display=swap'
	},
	Cantarell: {
		style: "font-family: 'Cantarell', sans-serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Cantarell&display=swap'
	},
	AdventPro: {
		style: "font-family: 'Advent Pro', sans-serif; font-size: 1.4em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Advent+Pro&display=swap'
	},
	// Monoton: {
	// 	style: "font-family: 'Monoton', cursive; font-size: 1.6em;", // Adjusted size
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Monoton&display=swap'
	// },
	Creepster: {
		style: "font-family: 'Creepster', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Creepster&display=swap'
	},
	RubikBubbles: {
		style: "font-family: 'Rubik Bubbles', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Rubik+Bubbles&display=swap'
	},
	Ultra: {
		style: "font-family: 'Ultra', serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Ultra&display=swap'
	},
	Fascinate: {
		style: "font-family: 'Fascinate', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Fascinate&display=swap'
	},

	Metamorphous: {
		style: "font-family: 'Metamorphous', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Metamorphous&display=swap'
	}
};
