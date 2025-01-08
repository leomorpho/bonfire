import { Schema as S, type Roles, type ClientSchema, or } from '@triplit/client';

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
			}),
			attendances: S.RelationMany('attendees', {
				where: [['user_id', '=', '$id']]
			})
			// // TODO: remove events field
			// events: S.RelationMany('events', {
			// 	where: [
			// 		or([
			// 			['user_id', '=', '$id'], // User is the creator
			// 			['attending_users.id', '=', '$id'] // User is an attendee
			// 		])
			// 	]
			// })
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['id', '=', '$role.userId'], // User can read their own profile
							// A user should be able to only query for users and attendees who are attending a same event:
							['attendances.event.attendees.user_id', '=', '$role.userId']
						])
					]
				},
				update: {
					filter: [['id', '=', '$role.userId']] // Users can only update their own profile images
				},
				delete: {
					filter: [['id', '=', '$role.userId']] // Users can only delete their own profile images
				}
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
			user: {
				read: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // User can read their own profile
							// A user should be able to only query for users and attendees who are attending a same event:
							['user.attendances.event.attendees.user_id', '=', '$role.userId']
						])
					]
				},
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
				read: { filter: [false] }
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
			announcements: S.RelationMany('announcement', {
				where: [['event_id', '=', '$id']]
			}),
			files: S.RelationMany('files', {
				where: [['event_id', '=', '$id']]
			}),
			// attending_users: S.RelationMany('user', {
			// 	where: [['events.id', '=', '$id']]
			// }),
			viewers: S.RelationMany('event_viewers', {
				where: [['event_id', '=', '$id']]
			}),
			style: S.String({ nullable: true }),
			overlay_color: S.String({ nullable: true, optional: true }),
			overlay_opacity: S.Number({ nullable: true, optional: true })
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // User can read their own profile
							// A user should be able to only query for users and attendees who are attending a same event:
							['attendees.user_id', '=', '$role.userId'],
							['viewers.user_id', '=', '$role.userId'] // user is a viewer
						])
					]
				},
				insert: { filter: [true] },
				update: { filter: [['user_id', '=', '$role.userId']] },
				delete: { filter: [['user_id', '=', '$role.userId']] }
			}
		}
	},
	event_viewers: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(), // ID of the event
			event: S.RelationById('events', '$event_id'), // Link to the event
			user_id: S.String(),
			user: S.RelationById('user', '$user_id')
		}),
		permissions: {
			user: {
				read: {
					filter: [
						['user_id', '=', '$role.userId'] // User can read their view objects
					]
				}
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
			updated_at: S.Date({ default: S.Default.now() }), // Last updated timestamp

			// Foreign Key Relations
			seen_announcements: S.RelationMany('seen_announcements', {
				where: [['attendee_id', '=', '$id']] // Link to seen_announcements
			}),
			seen_gallery_items: S.RelationMany('seen_gallery_items', {
				where: [['attendee_id', '=', '$id']] // Link to seen_gallery_items
			})
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // User can read their own profile
							// A user should be able to only query for users and attendees who are attending a same event:
							['event.attendees.user_id', '=', '$role.userId']
							// 	['viewers.id', '=', '$role.userId'] // user is a viewer
						])
					]
				},
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
			event: S.RelationById('events', '$event_id'), // Link to the event
			seen_by: S.RelationMany('seen_gallery_items', {
				where: [['gallery_item_id', '=', '$id']]
			})
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['uploader_id', '=', '$role.userId'], // User can read their own profile
							// A user should be able to only query for files of events they are attending:
							['event.attendees.user_id', '=', '$role.userId']
						])
					]
				},
				// No need to allow insert since we will do that in BE logic and
				// triplit doesn't seem powerful enough to be able to set appropriate permissions (user
				// is attending event). Read is only used to count files as S3 URL is generated in BE.
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

			seen_by: S.RelationMany('seen_announcements', {
				where: [['announcement_id', '=', '$id']]
			})
		}),
		permissions: {
			user: {
				read: {
					filter: [
						['user_id', '=', '$role.userId'], // User can read their own profile
						// A user should be able to only query for files of events they are attending:
						['event.attendees.user_id', '=', '$role.userId']
					]
				},
				insert: { filter: [['event.user_id', '=', '$role.userId']] },
				update: { filter: [['user_id', '=', '$role.userId']] },
				delete: { filter: [['user_id', '=', '$role.userId']] }
			}
		}
	},
	seen_announcements: {
		schema: S.Schema({
			id: S.Id(),
			attendee_id: S.String(), // ID of the attendee
			attendee: S.RelationById('attendees', '$attendee_id'), // Link to the attendee
			announcement_id: S.String(), // ID of the seen announcement
			announcement: S.RelationById('announcement', '$announcement_id'), // Link to the announcement
			seen_at: S.Date({ default: S.Default.now() }) // Timestamp when the announcement was seen
		}),
		permissions: {
			user: {
				read: { filter: [['attendee.user_id', '=', '$role.userId']] }, // Only the user can read their seen announcements
				insert: { filter: [['attendee.user_id', '=', '$role.userId']] }, // Only the user can mark an announcement as seen
				update: { filter: [['attendee.user_id', '=', '$role.userId']] }, // Only the user can update their seen announcements
				delete: { filter: [['attendee.user_id', '=', '$role.userId']] } // Only the user can delete their seen announcements
			},
			anon: {
				read: { filter: [false] } // Anonymous users cannot access seen announcements
			}
		}
	},
	// TODO: nothing implemented for seen_gallery_items. It would also be useful to track which file was downloaded by who so they can quickly download any new diff.
	seen_gallery_items: {
		schema: S.Schema({
			id: S.Id(),
			attendee_id: S.String(), // ID of the attendee
			attendee: S.RelationById('attendees', '$attendee_id'), // Link to the attendee
			gallery_item_id: S.String(), // ID of the seen gallery item
			gallery_item: S.RelationById('files', '$gallery_item_id'), // Link to the gallery item
			seen_at: S.Date({ default: S.Default.now() }) // Timestamp when the gallery item was seen
		}),
		permissions: {
			user: {
				read: { filter: [['attendee.user_id', '=', '$role.userId']] }, // Only the user can read their seen gallery items
				insert: { filter: [['attendee.user_id', '=', '$role.userId']] }, // Only the user can mark a gallery item as seen
				update: { filter: [['attendee.user_id', '=', '$role.userId']] }, // Only the user can update their seen gallery items
				delete: { filter: [['attendee.user_id', '=', '$role.userId']] } // Only the user can delete their seen gallery items
			},
			anon: {
				read: { filter: [false] } // Anonymous users cannot access seen gallery items
			}
		}
	},
	notifications_queue: {
		schema: S.Schema({
			id: S.Id(),
			user_id: S.String(), // ID of the user creating the notification
			user: S.RelationById('user', '$user_id'),
			event_id: S.String(),
			event: S.RelationById('events', '$event_id'),
			object_type: S.String(),
			object_ids: S.String(),
			created_at: S.Date({ default: S.Default.now() }), // Timestamp for creation
			sent_at: S.Date({ nullable: true, default: null }), // Timestamp for when the notification was sent
			sent: S.Boolean({ default: false })
		}),
		permissions: {
			user: {
				read: { filter: [['user_id', '=', '$role.userId']] }, // Users can read their own notifications
				insert: { filter: [['user_id', '=', '$role.userId']] }, // Users can insert their own notifications (if needed)
				update: { filter: [['user_id', '=', '$role.userId']] }, // Users can update their own notifications
				delete: { filter: [['user_id', '=', '$role.userId']] } // Users can delete their own notifications
			},
			anon: {}
		}
	},
	notifications: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String({ nullable: true }), // Optional ID of the related event
			event: S.RelationById('events', '$event_id'), // Link to the event
			user_id: S.String(), // Optional ID of the recipient
			user: S.RelationById('user', '$user_id'), // Link to the user
			message: S.String(), // Notification content
			object_type: S.String(),
			object_ids: S.String(),
			created_at: S.Date({ default: S.Default.now() }), // Timestamp of when the notification was sent
			seen_at: S.Date({ nullable: true, default: null }),
			num_push_notifications_sent: S.Number({ default: 0 })
			// last_push_notifications_sent_at: S.Date({ nullable: true, default: null, optional: true })
		}),
		permissions: {
			user: {
				read: { filter: [['user_id', '=', '$role.userId']] }, // Users can read their own notifications
				update: { filter: [['user_id', '=', '$role.userId']] }, // Users can update their own notifications to mark them as read
				delete: { filter: [['user_id', '=', '$role.userId']] } // Users can update their own notifications to mark them as read
			}
		}
	}
} satisfies ClientSchema;
