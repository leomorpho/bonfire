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
	},
	anon: {
		match: {
			type: 'anon'
		}
	}
};

// Define schema with permissions
export const schema = {
	user: {
		schema: S.Schema({
			id: S.String(),
			username: S.String(),
			profile_image: S.RelationOne('profile_images', {
				where: [['user_id', '=', '$id']]
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
				read: { filter: [true] },
				update: {
					filter: [['id', '=', '$role.userId']] // Users can only update their own profile images
				},
				delete: {
					filter: [['id', '=', '$role.userId']] // Users can only delete their own profile images
				}
			},
			anon: {
				read: { filter: [true] }
			}
		}
	},
	profile_images: {
		schema: S.Schema({
			id: S.Id(), // Unique ID for the image
			user_id: S.String(), // ID of the user who owns the image
			user: S.RelationById('user', '$user_id'), // Relation to the user table
			full_image_key: S.String(), // Key for the full version of the image
			small_image_key: S.String(), // Key for the smaller version of the image
			uploaded_at: S.Date({ default: S.Default.now() }) // Timestamp of upload
		}),
		permissions: {
			admin: {
				read: { filter: [true] }, // Admins can read all profile images
				insert: { filter: [true] }, // Admins can insert new profile images
				update: { filter: [true] }, // Admins can update profile images
				delete: { filter: [true] } // Admins can delete profile images
			},
			user: {
				read: { filter: [true] },
				insert: {
					filter: [['user_id', '=', '$role.userId']] // Users can only insert their own profile images
				},
				update: {
					filter: [['user_id', '=', '$role.userId']] // Users can only update their own profile images
				},
				delete: {
					filter: [['user_id', '=', '$role.userId']] // Users can only delete their own profile images
				}
			},
			anon: {
				read: { filter: [true] }
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
			user: S.RelationById('user', '$user_id'),
			attendees: S.RelationMany('attendees', {
				where: [['event_id', '=', '$id']]
			}),
			annoucements : S.RelationMany('announcements', {
				where: [['event_id', '=', '$id']]
			}),
			style: S.String({nullable: true}),
			overlay_color: S.String({nullable: true, optional: true}),
			overlay_opacity: S.String({nullable: true, optional: true}),
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] },
				delete: { filter: [true] }
			},
			user: {
				// read: { filter: [['$role.userId', 'in', ['attendees.user_id']]] },
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [['user_id', '=', '$role.userId']] },
				delete: { filter: [['user_id', '=', '$role.userId']] }
			},
			anon: {
				read: { filter: [true] }
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
			// guest_count: S.Number({ default: 0 }), // Number of additional guests
			// special_requests: S.String({ nullable: true }), // Any special requests (e.g., dietary)
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
				read: { filter: [true] },
				// read: {
				// 	filter: [
				// 		['event.attendees.user_id', '=', '$role.userId'] // Users can only see attendees for events they are part of
				// 	]
				// },
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
			anon: {
				read: { filter: [false] }
			}
		}
	},
	files: {
		schema: S.Schema({
			id: S.Id(),
			file_key: S.String(), // S3 key for the file
			file_type: S.String(), // e.g., 'image', 'video', 'gif'
			file_name: S.String(),
			h_pixel: S.Number({ nullable: true }),
			w_pixel: S.Number({ nullable: true }),
			size_in_bytes: S.Number(),
			uploaded_at: S.Date({ default: S.Default.now() }),
			uploader_id: S.String(), // ID of the attendee
			uploader: S.RelationById('user', '$user_id'), // Link to the user
			event_id: S.String(), // ID of the event
			event: S.RelationById('events', '$event_id') // Link to the event
		}),
		permissions: {
			admin: {
				read: { filter: [true] }, // Admins can read all files
				insert: { filter: [true] }, // Admins can insert files
				update: { filter: [true] }, // Admins can update files
				delete: { filter: [true] } // Admins can delete files
			},
			user: {
				read: { filter: [true] },

				// read: {
				// 	filter: [
				// 		['event.attendees.user_id', '=', '$role.userId'] // Check if user is an attendee of the event
				// 	]
				// },
				// No need to allow read and insert since we will do that in BE logic and
				// triplit doesn't seem powerful enough to be able to set appropriate permissions (user
				// is attending event).
				update: {
					filter: [['uploader_id', '=', '$role.userId']] // Users can only update their own files
				},
				delete: {
					filter: [['uploader_id', '=', '$role.userId']] // Users can only delete their own files
				}
			}
		}
	},
	announcement: {
		schema: S.Schema({
			id: S.Id(),
			content: S.String(),
			created_at: S.Date({ default: S.Default.now() }),
			user_id: S.String(),
			user: S.RelationById('user', '$user_id'),
			event_id: S.String(),
			event: S.RelationById('events', '$event_id'),
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] },
				delete: { filter: [true] }
			},
			user: {
				read: { filter: [true] },
				insert: { filter: [['event.user_id', '=', '$role.userId']] },
				update: { filter: [['user_id', '=', '$role.userId']] },
				delete: { filter: [['user_id', '=', '$role.userId']] }
			}
		}
	},
	// notifications: {
	// 	schema: S.Schema({
	// 		id: S.Id(),
	// 		event_id: S.String({ nullable: true }), // Optional ID of the related event
	// 		event: S.RelationById('events', '$event_id'), // Link to the event
	// 		user_id: S.String({ nullable: true }), // Optional ID of the recipient
	// 		user: S.RelationById('user', '$user_id'), // Link to the user
	// 		type: S.String(), // Notification type: reminder, update, etc.
	// 		message: S.String(), // Notification content
	// 		sent_at: S.Date({ default: S.Default.now() }) // Timestamp of when the notification was sent
	// 	}),
	// 	permissions: {
	// 		admin: {
	// 			read: { filter: [true] },
	// 			insert: { filter: [true] },
	// 			update: { filter: [true] },
	// 			delete: { filter: [true] }
	// 		},
	// 		user: {
	// 			read: { filter: [['user_id', '=', '$role.userId']] } // Users can read their own notifications
	// 		}
	// 	}
	// }
} satisfies ClientSchema;
