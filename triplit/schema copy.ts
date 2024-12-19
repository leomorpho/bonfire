import { Schema as S, type Roles, type ClientSchema, or, and } from '@triplit/client';

// Define roles
export const roles: Roles = {
	admin: {
		match: {
			type: 'admin'
		}
	},
	user: {
		match: {
			type: 'user',
			uid: '$userId'
		}
	},
};

// Define schema with permissions
export const schema = {
	user: {
		schema: S.Schema({
			id: S.String(),
			username: S.String(),
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['id', '=', '$role.userId'],
							{
								exists: {
									collectionName: 'events', // There exists an event where...
									where: [
										and([
											// Current user is an attendee
											{
												exists: {
													collectionName: 'attendees',
													where: [
														['event_id', '=', '$1.id'],
														['user_id', '=', '$role.userId']
													]
												}
											},
											// AND other user is an attendee
											{
												exists: {
													collectionName: 'attendees',
													where: [
														['event_id', '=', '$1.id'],
														['user_id', '=', '$2.user_id']
													]
												}
											}
										])
									]
								}
							}
						])
					]
				},
				update: {
					filter: [['id', '=', '$role.userId']] // Users can only update their own profile images
				},
				delete: {
					filter: [['id', '=', '$role.userId']] // Users can only delete their own profile images
				}
			},
		}
	},
	events: {
		schema: S.Schema({
			id: S.Id(),
			title: S.String(),
			user_id: S.String(),
			user: S.RelationById('user', '$user_id'),
			attendees: S.RelationMany('attendees', {
				where: [['event_id', '=', '$id']]
			}),
		}),
		permissions: {
			user: {
				read: {
					filter: [
						{
							exists: {
								// User has an attendance object for this event
								collectionName: 'attendees',
								where: [
									['user_id', '=', '$role.userId'], // Current user is an attendee
									['event_id', '=', '$id'] // Linked event
								]
							}
						}
					]
				},
				insert: { filter: [true] },
				update: { filter: [['user_id', '=', '$role.userId']] },
				delete: { filter: [['user_id', '=', '$role.userId']] }
			}
		}
	},
	attendees: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(), // ID of the event
			event: S.RelationById('events', '$event_id'), // Link to the event
			user_id: S.String(), // ID of the attendee
			user: S.RelationById('user', '$user_id'), // Link to the user
			status: S.String({ default: 'undecided' }), // RSVP status: attending, not attending, undecided
			updated_at: S.Date({ default: S.Default.now() }) // Last updated timestamp
		}),
		permissions: {
			user: {
				read: { filter: [true] },
				insert: {
					// Users can RSVP or add themselves as attendees
					filter: [['user_id', '=', '$role.userId']]
				},
				update: {
					// Users can update their RSVP or attendance
					filter: [['user_id', '=', '$role.userId']]
				},
				delete: {
					// Users can remove themselves from the event
					filter: [['user_id', '=', '$role.userId']]
				}
			},
		}
	},
} satisfies ClientSchema;
