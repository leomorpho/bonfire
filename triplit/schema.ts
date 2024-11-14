import { Schema as S, type Roles, type ClientSchema } from '@triplit/client';

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
	}
};

// Define schema with permissions
export const schema = {
	user: {
		schema: S.Schema({
			id: S.String(),
			username: S.String()
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] },
				delete: { filter: [true] }
			},
			user: {
				// Disallow all CRUD operations for regular users
			}
		}
	},
	events: {
		schema: S.Schema({
			id: S.Id(),
			title: S.String(),
			description: S.String({ nullable: true }),
			start_time: S.Date(),
			end_time: S.Date({ nullable: true }),
			location: S.String({ nullable: true }),
			user_id: S.String(),
			user: S.RelationById('user', '$user_id')
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] },
				delete: { filter: [true] }
			},
			user: {
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
			response: S.String({ default: 'undecided' }), // RSVP status: attending, not attending, undecided
			invitation_status: S.String({ default: 'invited' }), // Invitation status: invited, confirmed, declined
			guest_count: S.Number({ default: 0 }), // Number of additional guests
			special_requests: S.String({ nullable: true }), // Any special requests (e.g., dietary)
			updated_at: S.Date({ default: S.Default.now() }) // Last updated timestamp
		}),
		permissions: {
			admin: {
				// Admins can manage all attendance records
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] },
				delete: { filter: [true] }
			},
			user: {
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
			}
		}
	},
	comments: {
		schema: S.Schema({
			id: S.Id(),
			content: S.String(),
			created_at: S.Date({ default: S.Default.now() }),
			user_id: S.String(),
			user: S.RelationById('user', '$user_id'),
			event_id: S.String(),
			event: S.RelationById('events', '$event_id'),
			parent_comment_id: S.String({ nullable: true }),
			parent_comment: S.RelationById('comments', '$parent_comment_id'),
			replies: S.RelationMany('comments', {
				where: [['parent_comment_id', '=', '$id']],
				limit: 2
			})
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] },
				delete: { filter: [true] }
			},
			user: {
				insert: { filter: [true] },
				update: { filter: [['user_id', '=', '$role.userId']] },
				delete: { filter: [['user_id', '=', '$role.userId']] }
			}
		}
	},
	images: {
		schema: S.Schema({
			id: S.Id(),
			url: S.String(),
			uploaded_at: S.Date({ default: S.Default.now() }),
			uploader_id: S.String(),
			uploader: S.RelationById('user', '$user_id'),
			event_id: S.String(),
			event: S.RelationById('events', '$event_id')
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] },
				delete: { filter: [true] }
			},
			user: {
				insert: { filter: [true] },
				update: { filter: [['uploader_id', '=', '$role.userId']] },
				delete: { filter: [['uploader_id', '=', '$role.userId']] }
			}
		}
	},
	notifications: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String({ nullable: true }), // Optional ID of the related event
			event: S.RelationById('events', '$event_id'), // Link to the event
			user_id: S.String({ nullable: true }), // Optional ID of the recipient
			user: S.RelationById('user', '$user_id'), // Link to the user
			type: S.String(), // Notification type: reminder, update, etc.
			message: S.String(), // Notification content
			sent_at: S.Date({ default: S.Default.now() }) // Timestamp of when the notification was sent
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] },
				delete: { filter: [true] }
			},
			user: {
				read: { filter: [['user_id', '=', '$role.userId']] } // Users can read their own notifications
			}
		}
	}
} satisfies ClientSchema;
