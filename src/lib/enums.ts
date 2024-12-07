export enum AttendanceStatus {
	GOING = 'going',
	NOT_GOING = 'not_going',
	MAYBE = 'maybe',
	DEFAULT = 'RSVP'
}

export enum EventStatus {
	ACTIVE = 'active',
	CANCELLED = 'cancelled'
}

export const LOGIN_TYPE_MAGIC_LINK = 'magic';
export const LOGIN_TYPE_ACTIVATION = 'activation';

export const getStrValueOfRSVP = (status: string) => {
	switch (status) {
		case AttendanceStatus.GOING:
			return 'Going';
		case AttendanceStatus.NOT_GOING:
			return 'Not going';
		case AttendanceStatus.MAYBE:
			return 'Maybe';
		default:
			return 'RSVP';
	}
};
