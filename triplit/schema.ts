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
	temp: {
		match: {
			type: 'temp',
			uid: '$temporaryAttendeeId'
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
			},
			temp: {
				read: {
					filter: [
						or([
							// A user should be able to only query for users and attendees who are attending a same event:
							['attendances.event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']
						])
					]
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
			uploaded_at: S.Date({ default: S.Default.now() }), // Timestamp of upload
			blurr_hash: S.Optional(S.String({ nullable: true, default: null, optional: true }))
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
			temp: {
				read: {
					filter: [
						or([
							// A user should be able to only query for users and attendees who are attending a same event:
							['user.attendances.event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']
						])
					]
				}
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
			geocoded_location: S.Optional(S.String({ nullable: true })),
			user_id: S.String(),
			user: S.RelationById('user', '$user_id'),
			attendees: S.RelationMany('attendees', {
				where: [['event_id', '=', '$id']]
			}),
			temporary_attendees: S.RelationMany('temporary_attendees', {
				where: [['event_id', '=', '$id']]
			}),
			announcements: S.RelationMany('announcement', {
				where: [['event_id', '=', '$id']]
			}),
			files: S.RelationMany('files', {
				where: [['event_id', '=', '$id']]
			}),
			banner_media: S.RelationOne('banner_media', {
				where: [['event_id', '=', '$id']]
			}),
			viewers: S.RelationMany('event_viewers', {
				where: [['event_id', '=', '$id']]
			}),
			event_admins: S.RelationMany('event_admins', {
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
							['user_id', '=', '$role.userId'], // User can read their own events
							// A user can only see events they are attending:
							['attendees.user_id', '=', '$role.userId'],
							['viewers.user_id', '=', '$role.userId'] // user is a viewer
						])
					]
				},
				insert: { filter: [true] },
				update: { filter: [['user_id', '=', '$role.userId']] },
				delete: { filter: [['user_id', '=', '$role.userId']] }
			},
			temp: {
				read: {
					filter: [
						or([
							// A user should be able to only query for users and attendees who are attending a same event:
							['temporary_attendees.id', '=', '$role.temporaryAttendeeId']
						])
					]
				}
			}
		}
	},
	event_admins: {
		schema: S.Schema({
			id: S.Id(), // Unique ID for each entry
			event_id: S.String(), // ID of the event this admin is associated with
			event: S.RelationById('events', '$event_id'), // Relation to the events table
			user_id: S.String(), // ID of the user who is an admin
			user: S.RelationById('user', '$user_id'), // Relation to the user table
			added_by_user_id: S.String(), // ID of the user who added this admin
			added_by_user: S.RelationById('user', '$added_by_user_id'), // Relation to the user who added this admin
			role: S.String({ default: 'editor' }), // Role of the admin (e.g., editor, moderator)
			created_at: S.Date({ default: S.Default.now() }), // Timestamp when the admin was added
			updated_at: S.Date({ default: S.Default.now() }) // Timestamp when the entry was last updated
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // The admin can view their own admin entry
							['event.user_id', '=', '$role.userId'], // Event creator can view all admins
							['event.attendees.user_id', '=', '$role.userId'] // Users attending the event can view event admins
						])
					]
				},
				insert: {
					filter: [
						['event.user_id', '=', '$role.userId'] // Only the event creator can add admins
					]
				},
				update: {
					filter: [
						or([
							['event.user_id', '=', '$role.userId'] // Event creator can update any admin's role/permissions
						])
					]
				},
				delete: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Admin can remove themselves
							['event.user_id', '=', '$role.userId'] // Event creator can remove any admin
						])
					]
				}
			},
			temp: {
				read: {
					filter: [
						['event.temporary_attendees.id', '=', '$role.temporaryAttendeeId'] // Temp users can view event admins if they're part of the event
					]
				}
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
			}),
			admin_role: S.RelationOne('event_admins', {
				where: [
					and([
						['user_id', '=', '$user_id'],
						['event_id', '=', '$event_id']
					])
				]
			})
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							// Event creator can see anyone attending
							['event.user_id', '=', '$role.userId'],
							// User can read their own profile
							['user_id', '=', '$role.userId'],
							// A user should be able to only query for users and attendees who are attending a same event:
							['event.attendees.user_id', '=', '$role.userId']
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
					filter: [
						or([
							// Event creator can delete anyone attending
							['event.user_id', '=', '$role.userId'],
							// Users can remove themselves from the event
							['user_id', '=', '$role.userId'],
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can update files
						])
					]
				}
			},
			temp: {
				read: {
					filter: [
						or([
							// A user should be able to only query for users and attendees who are attending a same event:
							['event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']
						])
					]
				}
			}
		}
	},
	temporary_attendees_secret_mapping: {
		schema: S.Schema({
			id: S.Id(),
			temporary_attendee_id: S.String(),
			temporary_attendee: S.RelationById('temporary_attendees', '$temporary_attendee_id')
		}),
		permissions: {
			user: {},
			temp: {}
		}
	},
	temporary_attendees: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(), // ID of the event
			event: S.RelationById('events', '$event_id'), // Link to the event
			status: S.String({ default: 'undecided' }), // RSVP status: attending, not attending, undecided
			name: S.String(),
			updated_at: S.Date({ default: S.Default.now() }), // Last updated timestamp
			secret_mapping: S.RelationOne('temporary_attendees_secret_mapping', {
				where: [['temporary_attendee_id', '=', '$id']]
			})
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							// Event creator can see anyone attending
							['event.user_id', '=', '$role.userId'],
							// A user should be able to only query for users and attendees who are attending a same event:
							['event.attendees.user_id', '=', '$role.userId']
						])
					]
				},
				delete: {
					filter: [
						or([
							['event.user_id', '=', '$role.userId'], // Event creator can delete anyone attending
							['id', '=', '$role.temporaryAttendeeId'], // Temp users can remove themselves from the event
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can update files
						])
					]
				}
			},
			temp: {
				read: {
					filter: [
						or([
							['id', '=', '$role.temporaryAttendeeId'], // User can read their own profile
							// A user should be able to only query for users and attendees who are attending a same event:
							['event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']
						])
					]
				},
				update: {
					filter: [
						or([
							['id', '=', '$role.temporaryAttendeeId'] // User can read their own profile
						])
					]
				}
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
			blurr_hash: S.String({ nullable: true, default: null, optional: true }),
			size_in_bytes: S.Number(),
			uploaded_at: S.Date({ default: S.Default.now() }),
			uploader_id: S.String({ nullable: true, default: null, optional: true }), // ID of the attendee
			uploader: S.RelationById('user', '$user_id'), // Link to the user
			temp_uploader_id: S.String({ nullable: true, default: null, optional: true }), // ID of the attendee
			temp_uploader: S.RelationById('temporary_attendees', '$id'), // Link to the user
			event_id: S.String(), // ID of the event
			event: S.RelationById('events', '$event_id'), // Link to the event
			seen_by: S.RelationMany('seen_gallery_items', {
				where: [['gallery_item_id', '=', '$id']]
			}),
			// Link to supporting files; for example, for videos, we save a frame and link it to the video.
			linked_file_id: S.String({ nullable: true, default: null, optional: true }),
			linked_file: S.RelationById('files', '$linked_file_id'),
			is_linked_file: S.Boolean({ default: false })
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['uploader_id', '=', '$role.userId'], // User can read their own files
							['event.attendees.user_id', '=', '$role.userId'], // Attendees can read event files
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can read files
						])
					]
				},
				// No need to allow insert since we will do that in BE logic and
				// triplit doesn't seem powerful enough to be able to set appropriate permissions (user
				// is attending event). Read is only used to count files as S3 URL is generated in BE.
				update: {
					filter: [
						or([
							['uploader_id', '=', '$role.userId'], // Users can upload their own files
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can upload files
						])
					]
				},
				delete: {
					filter: [
						or([
							['uploader_id', '=', '$role.userId'], // Users can update their own files
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can update files
						])
					]
				}
			},
			temp: {
				read: {
					filter: [
						or([
							['uploader_id', '=', '$role.userId'], // Users can delete their own files
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can delete files
						])
					]
				}
			}
		}
	},
	banner_media: {
		schema: S.Schema({
			id: S.Id(),
			full_image_key: S.String(), // S3 key
			small_image_key: S.String(), // S3 key
			file_type: S.String(), // e.g., 'image', 'video', 'gif'
			h_pixel_lg: S.Number({ nullable: true }),
			w_pixel_lg: S.Number({ nullable: true }),
			h_pixel_sm: S.Number({ nullable: true }),
			w_pixel_sm: S.Number({ nullable: true }),
			blurr_hash: S.String({ nullable: true, default: null, optional: true }),
			size_in_bytes: S.Number(),
			uploaded_at: S.Date({ default: S.Default.now() }),
			uploader_id: S.String({ nullable: true, default: null, optional: true }), // ID of the attendee
			uploader: S.RelationById('user', '$user_id'), // Link to the user
			event_id: S.String(), // ID of the event
			event: S.RelationById('events', '$event_id') // Link to the event
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
			},
			temp: {
				read: {
					filter: [['event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']]
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
						['user_id', '=', '$role.userId'], // User can read their own announcements
						['event.attendees.user_id', '=', '$role.userId'], // Attendees can read event announcements
						['event.event_admins.user_id', '=', '$role.userId'] // Event admins can read announcements
					]
				},
				insert: {
					filter: [
						or([
							['event.user_id', '=', '$role.userId'], // Event creator can add announcements
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can add announcements
						])
					]
				},
				update: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Users can update their own announcements
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can update announcements
						])
					]
				},
				delete: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Users can delete their own announcements
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can delete announcements
						])
					]
				}
			},
			temp: {
				read: {
					filter: [
						// A user should be able to only query for announcements of events they are attending:
						['event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']
					]
				}
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
			temp: {
				insert: { filter: [['user_id', '=', '$role.temporaryAttendeeId']] } // Users can read their own notifications
			}
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
	},
	seamless_tiles: {
		schema: S.Schema({
			id: S.Id(),
			name: S.String({ nullable: true }),
			updated_at: S.Date({ default: S.Default.now() }), // Last updated timestamp
			enabled_in_prod: S.Boolean({ default: false }),
			url: S.String(),
			css_template: S.String()
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] }
			},
			user: {
				read: {
					filter: [
						and([
							['enabled_in_prod', '=', true],
							['name', '!=', null]
						])
					]
				}
			},
			temp: {}
		}
	}
} satisfies ClientSchema;
