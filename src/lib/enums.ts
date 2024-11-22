export const GOING = 'going';
export const NOT_GOING = 'not_going';
export const MAYBE = 'maybe';
export const DEFAULT = 'RSVP';

export const LOGIN_TYPE_MAGIC_LINK = 'magic';
export const LOGIN_TYPE_ACTIVATION = 'activation';

export const getStrValueOfRSVP = (status: string) => {
	switch (status) {
		case GOING:
			return 'Going';
		case NOT_GOING:
			return 'Not going';
		case MAYBE:
			return 'Maybe';
		default:
			return 'RSVP';
	}
};
