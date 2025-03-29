import { BringListCountTypes, HistoryChangesConstants, TransactionType } from '$lib/enums';
import { MAIN_THREAD } from '$lib/im';
import { Schema as S, type Roles, or, and } from '@triplit/client';

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
export const schema = S.Collections({
	user: {
		schema: S.Schema({
			id: S.String(),
			username: S.String(),
			is_fully_onboarded: S.Optional(S.Boolean({ default: false })),

			favourite_non_profit_id: S.Optional(S.String()), // Non-profit the user currently contributes to by default
			created_at: S.Optional(S.Date({ default: S.Default.now() })),
			updated_at: S.Optional(S.Date({ default: null, nullable: true }))
		}),
		relationships: {
			profile_image: S.RelationOne('profile_images', {
				where: [['user_id', '=', '$id']]
			}),
			user_log_tokens: S.RelationOne('user_log_tokens', {
				where: [['user_id', '=', '$id']]
			}),
			attendances: S.RelationMany('attendees', {
				where: [['user_id', '=', '$id']]
			}),
			favourite_non_profit: S.RelationById('non_profits', '$favourite_non_profit_id')
		},
		permissions: {
			admin: {
				read: { filter: [true] }
				// insert: { filter: [true] },
				// update: { filter: [true] }
			},
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
			},
			anon: {}
		}
	},
	profile_images: {
		schema: S.Schema({
			id: S.Id(), // Unique ID for the image
			user_id: S.String(), // ID of the user who owns the image
			full_image_key: S.String(), // Key for the full version of the image
			small_image_key: S.String(), // Key for the smaller version of the image
			uploaded_at: S.Date({ default: S.Default.now() }), // Timestamp of upload
			blurr_hash: S.Optional(S.String({ nullable: true, default: null, optional: true }))
		}),
		relationships: {
			user: S.RelationById('user', '$user_id') // Relation to the user table
		},
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
			},
			anon: {}
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
			latitude: S.Optional(S.Number()),
			longitude: S.Optional(S.Number()),
			user_id: S.String(),
			max_num_guests_per_attendee: S.Optional(S.Number({ default: 0 })),
			transaction_id: S.Optional(S.String()),
			non_profit_id: S.Optional(S.String({ nullable: true })), // Non-profit the event contributes to
			style: S.String({ nullable: true }),
			overlay_color: S.String({ nullable: true, optional: true }),
			overlay_opacity: S.Number({ nullable: true, optional: true }),
			created_at: S.Optional(S.Date({ default: S.Default.now() })),
			max_capacity: S.Optional(S.Number({ default: null, nullable: true })),
			is_published: S.Optional(S.Boolean({ default: false }))
		}),
		relationships: {
			user: S.RelationById('user', '$user_id'),
			attendees: S.RelationMany('attendees', {
				where: [['event_id', '=', '$1.id']]
			}),
			temporary_attendees: S.RelationMany('temporary_attendees', {
				where: [['event_id', '=', '$1.id']]
			}),
			announcements: S.RelationMany('announcement', {
				where: [['event_id', '=', '$1.id']]
			}),
			files: S.RelationMany('files', {
				where: [['event_id', '=', '$1.id']]
			}),
			banner_media: S.RelationOne('banner_media', {
				where: [['event_id', '=', '$1.id']]
			}),
			viewers: S.RelationMany('event_viewers', {
				where: [['event_id', '=', '$1.id']]
			}),
			event_admins: S.RelationMany('event_admins', {
				where: [['event_id', '=', '$1.id']]
			}),
			bring_items: S.RelationMany('bring_items', {
				where: [['event_id', '=', '$1.id']]
			}),
			transaction: S.RelationOne('transactions', {
				where: [['event_id', '=', '$1.id']]
			}),
			non_profit: S.RelationById('non_profits', '$1.non_profit_id')
		},
		permissions: {
			admin: {
				read: { filter: [true] }
				// insert: { filter: [true] },
				// update: { filter: [true] }
			},
			user: {
				read: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // User can read their own events
							['attendees.user_id', '=', '$role.userId'], // A user can see events they are attending
							['viewers.user_id', '=', '$role.userId'] // Event viewers can see event
						])
					]
				},
				insert: { filter: [true] }, // Anyone can create an event
				update: {
					filter: [
						or([
							['user_id', '=', '$role.userId'],
							['event_admins.user_id', '=', '$role.userId']
						])
					]
				},
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
			},
			anon: {}
		}
	},
	event_admins: {
		schema: S.Schema({
			id: S.Id(), // Unique ID for each entry
			event_id: S.String(), // ID of the event this admin is associated with
			user_id: S.String(), // ID of the user who is an admin
			added_by_user_id: S.String(), // ID of the user who added this admin
			role: S.String({ default: 'editor' }), // Role of the admin (e.g., editor, moderator)
			created_at: S.Date({ default: S.Default.now() }), // Timestamp when the admin was added
			updated_at: S.Date({ default: S.Default.now() }) // Timestamp when the entry was last updated
		}),
		relationships: {
			event: S.RelationById('events', '$event_id'), // Relation to the events table
			user: S.RelationById('user', '$user_id'), // Relation to the user table
			added_by_user: S.RelationById('user', '$added_by_user_id') // Relation to the user who added this admin
		},
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
						or([
							['event.user_id', '=', '$role.userId'], // Event creator can add admins
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can add other admins
						])
					]
				},
				update: {
					filter: [
						or([
							['event.user_id', '=', '$role.userId'], // Event creator can update any admin's role/permissions
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can update other admins
						])
					]
				},
				delete: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Admin can remove themselves
							['event.user_id', '=', '$role.userId'], // Event creator can remove any admin
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can remove other admins
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
			},
			anon: {}
		}
	},
	event_viewers: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(), // ID of the event
			user_id: S.String(),
			created_at: S.Optional(S.Date({ default: S.Default.now() }))
		}),
		relationships: {
			event: S.RelationById('events', '$event_id'), // Link to the event
			user: S.RelationById('user', '$user_id')
		},
		permissions: {
			user: {
				read: {
					filter: [
						['user_id', '=', '$role.userId'] // User can read their view objects
					]
				}
			},
			temp: {},
			anon: {}
		}
	},
	attendees: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(), // ID of the event
			user_id: S.String(), // ID of the attendee
			status: S.String({ default: 'undecided' }), // RSVP status: attending, not attending, undecided
			guest_count: S.Optional(S.Number({ default: 0 })), // Number of additional guests
			// special_requests: S.String({ nullable: true }), // Any special requests (e.g., dietary)
			// NOTE: updated_at is a terrible name, it should be created_at
			updated_at: S.Date({ default: S.Default.now() }) // Last updated timestamp
			// Foreign Key Relations
		}),
		relationships: {
			event: S.RelationById('events', '$event_id'), // Link to the event
			user: S.RelationById('user', '$user_id'), // Link to the user
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
		},
		permissions: {
			admin: {
				read: { filter: [true] }
				// insert: { filter: [true] },
				// update: { filter: [true] }
			},
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
				update: {
					filter: [
						or([
							['event.user_id', '=', '$role.userId'],
							['event.event_admins.user_id', '=', '$role.userId']
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
			},
			anon: {}
		}
	},
	temporary_attendees_secret_mapping: {
		schema: S.Schema({
			id: S.Id(),
			temporary_attendee_id: S.String(),
			created_at: S.Optional(S.Date({ default: S.Default.now() }))
		}),
		relationships: {
			temporary_attendee: S.RelationById('temporary_attendees', '$temporary_attendee_id')
		},
		permissions: {
			user: {},
			temp: {},
			anon: {}
		}
	},
	temporary_attendees: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(), // ID of the event
			status: S.String({ default: 'undecided' }), // RSVP status: attending, not attending, undecided
			name: S.String(),
			guest_count: S.Optional(S.Number({ default: 0 })), // Number of additional guests
			updated_at: S.Date({ default: S.Default.now() }) // Last updated timestamp
		}),
		relationships: {
			event: S.RelationById('events', '$event_id'), // Link to the event
			secret_mapping: S.RelationOne('temporary_attendees_secret_mapping', {
				where: [['temporary_attendee_id', '=', '$id']]
			})
		},
		permissions: {
			admin: {
				read: { filter: [true] }
				// insert: { filter: [true] },
				// update: { filter: [true] }
			},
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
				}
			},
			anon: {}
		}
	},
	attendees_changes: {
		schema: S.Schema({
			id: S.Id(),
			attendee_id: S.String(), // ID of the attendee
			field_name: S.Optional(S.String()), // Name of the field that changed (e.g., 'status', 'guest_count')
			old_value: S.Optional(S.String()), // Previous value of the field
			new_value: S.Optional(S.String()), // New value of the field
			change_timestamp: S.Date({ default: S.Default.now() }), // Timestamp of the change
			changed_by: S.String(), // ID of the user who made the change
			change_type: S.String({
				enum: [HistoryChangesConstants.change_delete, HistoryChangesConstants.change_update]
			}) // Type of change (e.g., 'update')
		}),
		relationships: {
			attendee: S.RelationById('attendees', '$attendee_id'), // Link to the attendee
			changed_user: S.RelationById('user', '$changed_by') // Link to the user who made the change
		},
		permissions: {
			admin: {
				read: { filter: [true] }
			},
			user: {
				read: {
					filter: [
						or([
							// User can read changes related to their own attendees
							['attendee.user_id', '=', '$role.userId'],
							// Event creator can see changes for their event's attendees
							['attendee.event.user_id', '=', '$role.userId'],
							// Admins can see attendees' changes
							['attendee.event.event_admins.user_id', '=', '$role.userId']
						])
					]
				}
			},
			temp: {},
			anon: {}
		}
	},
	temporary_attendees_changes: {
		schema: S.Schema({
			id: S.Id(),
			temporary_attendee_id: S.String(), // ID of the attendee
			field_name: S.Optional(S.String()), // Name of the field that changed (e.g., 'status', 'guest_count')
			old_value: S.Optional(S.String()), // Previous value of the field
			new_value: S.Optional(S.String()), // New value of the field
			change_timestamp: S.Date({ default: S.Default.now() }), // Timestamp of the change
			changed_by: S.String(), // ID of the user who made the change
			changed_by_id_type: S.String({
				enum: [HistoryChangesConstants.user_id, HistoryChangesConstants.temporary_attendee_id]
			}),
			change_type: S.String({
				enum: [HistoryChangesConstants.change_delete, HistoryChangesConstants.change_update]
			}) // Type of change (e.g., 'update')
		}),
		relationships: {
			attendee: S.RelationById('temporary_attendees', '$temporary_attendee_id'), // Link to the attendee
			temporary_attendee: S.RelationById('temporary_attendees', '$temporary_attendee_id') // Link to the temporary attendee
		},
		permissions: {
			admin: {
				read: { filter: [true] }
			},
			user: {
				read: {
					filter: [
						or([
							// User can read changes related to their own attendees
							['temporary_attendee.id', '=', '$role.temporaryAttendeeId'],
							// Event creator can see changes for their event's attendees
							['temporary_attendee.event.user_id', '=', '$role.userId'],
							// Admins can see attendees' changes
							['temporary_attendee.event.event_admins.user_id', '=', '$role.userId']
						])
					]
				}
			},
			temp: {},
			anon: {}
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
			temp_uploader_id: S.String({ nullable: true, default: null, optional: true }), // ID of the attendee
			event_id: S.String(), // ID of the event
			// Link to supporting files; for example, for videos, we save a frame and link it to the video.
			linked_file_id: S.String({ nullable: true, default: null, optional: true }),
			is_linked_file: S.Boolean({ default: false })
		}),
		relationships: {
			uploader: S.RelationById('user', '$user_id'), // Link to the user
			temp_uploader: S.RelationById('temporary_attendees', '$id'), // Link to the user
			event: S.RelationById('events', '$event_id'), // Link to the event
			seen_by: S.RelationMany('seen_gallery_items', {
				where: [['gallery_item_id', '=', '$id']]
			}),
			linked_file: S.RelationById('files', '$linked_file_id')
		},
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['uploader_id', '=', '$role.userId'], // User can read their own files
							['event.attendees.user_id', '=', '$role.userId'], // Attendees can read event files
							['event.event_admins.user_id', '=', '$role.userId'], // Event admins can read files
							['event.user_id', '=', '$role.userId'] // event owner can do whatever
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
							['event.event_admins.user_id', '=', '$role.userId'], // Event admins can upload files
							['event.user_id', '=', '$role.userId'] // event owner can do whatever
						])
					]
				},
				delete: {
					filter: [
						or([
							['uploader_id', '=', '$role.userId'], // Users can update their own files
							['event.event_admins.user_id', '=', '$role.userId'], // Event admins can update files
							['event.user_id', '=', '$role.userId'] // event owner can do whatever
						])
					]
				}
			},
			temp: {
				read: {
					filter: [or([['event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']])]
				},
				delete: {
					filter: [
						or([
							['uploader_id', '=', '$role.temporaryAttendeeId'] // Users can delete their own files
						])
					]
				}
			},
			anon: {}
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
			event_id: S.String() // ID of the event
		}),
		relationships: {
			uploader: S.RelationById('user', '$user_id'), // Link to the user
			event: S.RelationById('events', '$event_id') // Link to the event
		},
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
			},
			anon: {}
		}
	},
	announcement: {
		schema: S.Schema({
			id: S.Id(),
			content: S.String(),
			created_at: S.Date({ default: S.Default.now() }),
			user_id: S.String(),
			event_id: S.String()
		}),
		relationships: {
			user: S.RelationById('user', '$user_id'),
			event: S.RelationById('events', '$event_id'),
			seen_by: S.RelationMany('seen_announcements', {
				where: [['announcement_id', '=', '$id']]
			})
		},
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // User can read their own announcements
							['event.attendees.user_id', '=', '$role.userId'], // Attendees can read event announcements
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can read announcements
						])
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
			},
			anon: {}
		}
	},
	seen_announcements: {
		schema: S.Schema({
			id: S.Id(),
			attendee_id: S.String(), // ID of the attendee
			announcement_id: S.String(), // ID of the seen announcement
			seen_at: S.Date({ default: S.Default.now() }) // Timestamp when the announcement was seen
		}),
		relationships: {
			attendee: S.RelationById('attendees', '$attendee_id'), // Link to the attendee
			announcement: S.RelationById('announcement', '$announcement_id') // Link to the announcement
		},
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
			gallery_item_id: S.String(), // ID of the seen gallery item
			seen_at: S.Date({ default: S.Default.now() }) // Timestamp when the gallery item was seen
		}),
		relationships: {
			attendee: S.RelationById('attendees', '$attendee_id'), // Link to the attendee
			gallery_item: S.RelationById('files', '$gallery_item_id') // Link to the gallery item
		},
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
			event_id: S.String(),
			object_type: S.String(),
			object_ids: S.String(),
			created_at: S.Date({ default: S.Default.now() }), // Timestamp for creation
			sent_at: S.Date({ nullable: true, default: null }), // Timestamp for when the notification was sent
			sent: S.Boolean({ default: false })
		}),
		relationships: {
			user: S.RelationById('user', '$user_id'),
			event: S.RelationById('events', '$event_id')
		},
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Users can read their own announcements
							['event.event_admins.user_id', '=', '$role.userId'], // Event admins can read notifications
							['event.user_id', '=', '$role.userId'] // Event owner can read notifications
						])
					]
				},
				insert: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Users can create their own announcements
							['event.event_admins.user_id', '=', '$role.userId'], // Event admins can create notifications
							['event.user_id', '=', '$role.userId'] // Event owner can create notifications
						])
					]
				}, // Users can insert their own notifications (if needed)
				update: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Users can update their own announcements
							['event.event_admins.user_id', '=', '$role.userId'], // Event admins can update notifications
							['event.user_id', '=', '$role.userId'] // Event owner can update notifications
						])
					]
				},
				delete: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Users can delete their own announcements
							['event.event_admins.user_id', '=', '$role.userId'], // Event admins can delete notifications
							['event.user_id', '=', '$role.userId'] // Event owner can delete notifications
						])
					]
				}
			},
			temp: {
				insert: { filter: [['user_id', '=', '$role.temporaryAttendeeId']] } // Users can read their own notifications
			},
			anon: {}
		}
	},
	notifications: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String({ nullable: true }), // Optional ID of the related event
			user_id: S.String(), // Optional ID of the recipient
			message: S.String(), // Notification content
			object_type: S.String(),
			object_ids: S.String(), // TODO: should have made this a set of IDs, would make so much more sense for checking with triplit logic (has/nothas filters)
			extra_id: S.Optional(S.String()),
			created_at: S.Date({ default: S.Default.now() }), // Timestamp of when the notification was sent
			seen_at: S.Date({ nullable: true, default: null }),
			num_push_notifications_sent: S.Number({ default: 0 })
			// last_push_notifications_sent_at: S.Date({ nullable: true, default: null, optional: true })
		}),
		relationships: {
			event: S.RelationById('events', '$event_id'), // Link to the event
			user: S.RelationById('user', '$user_id') // Link to the user
		},
		permissions: {
			user: {
				read: { filter: [['user_id', '=', '$role.userId']] }, // Users can read their own notifications
				update: { filter: [['user_id', '=', '$role.userId']] }, // Users can update their own notifications to mark them as read
				delete: { filter: [['user_id', '=', '$role.userId']] } // Users can update their own notifications to mark them as read
			},
			temp: {},
			anon: {}
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
			temp: {},
			anon: {}
		}
	},
	event_threads: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(), // ID of the event this message belongs to
			user_id: S.String({ nullable: true, default: null }), // ID of the user who created the thread
			name: S.String({ default: MAIN_THREAD }), // Thread name
			created_at: S.Date({ default: S.Default.now() }), // Timestamp when the message was sent
			updated_at: S.Optional(S.Date({ nullable: true, default: null })) // Timestamp when the message was edited
		}),
		relationships: {
			event: S.RelationById('events', '$event_id'), // Link to the event
			user: S.RelationById('user', '$user_id'), // Relation to the user
			messages: S.RelationMany('event_messages', {
				where: [['thread_id', '=', '$id']]
			})
		},
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['event.attendees.user_id', '=', '$role.userId'], // Users can read messages in events they attend
							['event.event_admins.user_id', '=', '$role.userId'] // Event admins can see all messages
						])
					]
				},
				insert: {
					filter: [
						or([
							['event.attendees.user_id', '=', '$role.userId'], // Attendees can send messages
							['event.event_admins.user_id', '=', '$role.userId'], // Event admins can send messages
							['event.user_id', '=', '$role.userId'] // Event owner can send messages
						])
					]
				},
				delete: {
					filter: [
						or([
							['event.event_admins.user_id', '=', '$role.userId'], // Event admins can delete messages
							['event.user_id', '=', '$role.userId'] // Event owner can delete any message
						])
					]
				}
			},
			temp: {
				// Temp users cannot actively participate in the conversation. They need to register to do so.
				read: {
					filter: [['event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']] // Temp users can see messages in their event
				}
			},
			anon: {}
		}
	},
	event_messages: {
		schema: S.Schema({
			id: S.Id(),
			thread_id: S.String({ nullable: false }), // Message must belong to a thread
			user_id: S.String(), // ID of the user who sent the message
			parent_message_id: S.String({ nullable: true, default: null }), // Supports future threading
			content: S.String({ nullable: true }), // Text content of the message
			created_at: S.Date({ default: S.Default.now() }), // Timestamp when the message was sent
			updated_at: S.Optional(S.Date({ nullable: true, default: null })), // Timestamp when the message was edited
			deleted_by_user_id: S.String({ nullable: true, default: null }) // ID of the user who sent the message
		}),
		relationships: {
			thread: S.RelationById('event_threads', '$thread_id'), // Relation to the thread
			user: S.RelationById('user', '$user_id'), // Relation to the user
			parent_message: S.RelationById('event_messages', '$parent_message_id'), // Parent message relation
			seen_by: S.RelationMany('event_message_seen', { where: [['message_id', '=', '$id']] }), // Tracks who has seen the message
			emoji_reactions: S.RelationMany('emoji_reactions', { where: [['entity_id', '=', '$id']] }), // Tracks who has seen the message
			deleted_by_user: S.RelationById('user', '$user_id') // Relation to the user
		},
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['thread.event.attendees.user_id', '=', '$role.userId'], // Users can read messages in events they attend
							['thread.event.event_admins.user_id', '=', '$role.userId'] // Event admins can see all messages
						])
					]
				},
				insert: {
					filter: [
						or([
							['thread.event.attendees.user_id', '=', '$role.userId'], // Attendees can send messages
							['thread.event.event_admins.user_id', '=', '$role.userId'], // Event admins can send messages
							['thread.event.user_id', '=', '$role.userId'] // Event owner can send messages
						])
					]
				},
				update: {
					filter: [['user_id', '=', '$role.userId']] // Users can only edit their own messages
				},
				delete: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Users can delete their own messages
							['thread.event.event_admins.user_id', '=', '$role.userId'], // Event admins can delete messages
							['thread.event.user_id', '=', '$role.userId'] // Event owner can delete any message
						])
					]
				}
			},
			temp: {
				// Temp users cannot actively participate in the conversation. They need to register to do so.
				read: {
					filter: [['thread.event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']] // Temp users can see messages in their event
				}
			},
			anon: {}
		}
	},
	event_message_seen: {
		schema: S.Schema({
			id: S.Id(),
			message_id: S.String(), // ID of the message
			user_id: S.String(), // User who has seen the message
			seen_at: S.Date({ default: S.Default.now() }) // Timestamp when the message was seen
		}),
		relationships: {
			message: S.RelationById('event_messages', '$message_id'), // Relation to the message
			user: S.RelationById('user', '$user_id') // Relation to the user
		},
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['message.thread.event.attendees.user_id', '=', '$role.userId'],
							['message.thread.event.event_admins.user_id', '=', '$role.userId'],
							['message.thread.event.user_id', '=', '$role.userId'],
							['user_id', '=', '$role.userId'] // Users can see their own seen status
						])
					]
				},
				insert: { filter: [['user_id', '=', '$role.userId']] }, // Users can mark messages as seen
				delete: { filter: [['user_id', '=', '$role.userId']] } // Users can remove their seen status (if needed)
			},
			temp: {},
			anon: {}
		}
	},
	reported_entities: {
		schema: S.Schema({
			id: S.Id(),
			entity_id: S.String(), // ID of the message
			entity_type: S.String(), // Type of the entity: message, announcement etc
			user_id: S.String(), // User who has seen the message
			event_id: S.String(),
			created_at: S.Date({ default: S.Default.now() }) // Timestamp when the message was seen
		}),
		relationships: {
			user: S.RelationById('user', '$user_id'), // Relation to the user
			event: S.RelationById('events', '$event_id')
		},
		permissions: {
			user: {
				read: {
					filter: [
						or([
							// ['event.attendees.user_id', '=', '$role.userId'],
							['event.event_admins.user_id', '=', '$role.userId'],
							['event.user_id', '=', '$role.userId'],
							['user_id', '=', '$role.userId'] // Users can see their own reported things
						])
					]
				},
				insert: { filter: [['user_id', '=', '$role.userId']] }, // Users can report stuff
				delete: {
					filter: [
						or([
							['event.event_admins.user_id', '=', '$role.userId'],
							['event.user_id', '=', '$role.userId'],
							['user_id', '=', '$role.userId']
						])
					]
				}
			},
			temp: {},
			anon: {}
		}
	},
	emoji_reactions: {
		schema: S.Schema({
			id: S.Id(),
			emoji: S.String(),
			entity_id: S.String(), // ID of the message
			entity_type: S.String(), // Type of the entity: message, announcement etc
			user_id: S.String(), // User who has seen the message
			event_id: S.String(),
			created_at: S.Date({ default: S.Default.now() }) // Timestamp when the message was seen
		}),
		relationships: {
			user: S.RelationById('user', '$user_id'), // Relation to the user
			event: S.RelationById('events', '$event_id')
		},
		permissions: {
			user: {
				read: {
					filter: [
						or([
							['event.attendees.user_id', '=', '$role.userId'],
							['event.event_admins.user_id', '=', '$role.userId'],
							['event.user_id', '=', '$role.userId'],
							['user_id', '=', '$role.userId'] // Users can see their own reported things
						])
					]
				},
				insert: { filter: [['user_id', '=', '$role.userId']] }, // Users can report stuff
				delete: { filter: [['user_id', '=', '$role.userId']] } // Users can remove stuff they report
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
			},
			anon: {}
		}
	},
	bring_items: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(),
			name: S.String(), // Item name (e.g., "Coca Cola", "Buns", "Beers")
			unit: S.String({
				enum: [BringListCountTypes.PER_PERSON, BringListCountTypes.COUNT] as const
			}),
			quantity_needed: S.Number(), // How much is requested
			details: S.String({ nullable: true, default: null }),
			created_by_user_id: S.String(), // Only admins can create items
			created_at: S.Date({ default: S.Default.now() })
		}),
		relationships: {
			event: S.RelationById('events', '$event_id'),
			created_by_user: S.RelationById('user', '$created_by_user_id'),
			bring_assignments: S.RelationMany('bring_assignments', {
				where: [['bring_item_id', '=', '$id']]
			})
		},
		permissions: {
			user: {
				read: { filter: [['event.attendees.user_id', '=', '$role.userId']] },
				insert: {
					filter: [
						or([
							['event.event_admins.user_id', '=', '$role.userId'],
							['event.user_id', '=', '$role.userId'],
							['event.attendees.user_id', '=', '$role.userId']
						])
					]
				},
				update: {
					filter: [
						or([
							['event.event_admins.user_id', '=', '$role.userId'],
							['event.user_id', '=', '$role.userId'],
							['created_by_user_id', '=', '$role.userId'] // Allow users to update their own items
						])
					]
				},
				delete: {
					filter: [
						or([
							['event.event_admins.user_id', '=', '$role.userId'],
							['event.user_id', '=', '$role.userId'],
							['created_by_user_id', '=', '$role.userId'] // Allow users to update their own items
						])
					]
				}
			},
			temp: {
				read: {
					filter: [['event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']]
				},
				insert: {
					filter: [['event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']]
				},
				update: {
					filter: [['created_by_user_id', '=', '$role.temporaryAttendeeId']]
				},
				delete: {
					filter: [['created_by_user_id', '=', '$role.temporaryAttendeeId']]
				}
			},
			anon: {}
		}
	},
	bring_assignments: {
		schema: S.Schema({
			id: S.Id(),
			bring_item_id: S.String(), // Item being assigned
			assigned_to_user_id: S.String({ nullable: true }),
			assigned_to_temp_attendee_id: S.String({ nullable: true }),
			assigned_by_user_id: S.String({ nullable: true }), // Who assigned it (null if self-assigned)
			quantity: S.Number(), // How much they are bringing
			created_at: S.Date({ default: S.Default.now() })
		}),
		relationships: {
			bring_item: S.RelationById('bring_items', '$bring_item_id'),
			assigned_to_user: S.RelationById('user', '$assigned_to_user_id'),
			assigned_to_temp_attendee: S.RelationById(
				'temporary_attendees',
				'$assigned_to_temp_attendee_id'
			),
			assigned_by_user: S.RelationById('user', '$assigned_by_user_id')
		},
		permissions: {
			user: {
				read: {
					// filter: [true]
					filter: [['bring_item.event.attendees.user_id', '=', '$role.userId']]
				},
				insert: {
					filter: [
						or([
							['bring_item.event.attendees.user_id', '=', '$role.userId'], // Attendees can self-assign
							['bring_item.event.event_admins.user_id', '=', '$role.userId'], // Admins can assign anyone
							['bring_item.event.user_id', '=', '$role.userId'] // Event owner can assign anyone
						])
					]
				},
				update: {
					filter: [
						or([
							['bring_item.event.attendees.user_id', '=', '$role.userId'], // Attendees can self-assign
							['bring_item.event.event_admins.user_id', '=', '$role.userId'], // Admins can assign anyone
							['bring_item.event.user_id', '=', '$role.userId'] // Event owner can assign anyone
						])
					]
				},
				delete: {
					filter: [
						or([
							['assigned_to_user_id', '=', '$role.userId'], // Users can remove their own assignment
							['bring_item.event.event_admins.user_id', '=', '$role.userId'], // Admins can remove assignments
							['bring_item.event.user_id', '=', '$role.userId'] // Event owner
						])
					]
				}
			},
			temp: {
				read: {
					filter: [['bring_item.event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']]
				},
				insert: {
					filter: [['bring_item.event.temporary_attendees.id', '=', '$role.temporaryAttendeeId']]
				},
				update: {
					filter: [['assigned_to_temp_attendee_id', '=', '$role.temporaryAttendeeId']]
				},
				delete: {
					filter: [['assigned_to_temp_attendee_id', '=', '$role.temporaryAttendeeId']]
				}
			},
			anon: {}
		}
	},
	user_log_tokens: {
		schema: S.Schema({
			id: S.Id(),
			user_id: S.String(), // User who owns the logs
			num_logs: S.Number({ default: 0 }), // Number of logs the user has
			updated_at: S.Date({ default: S.Default.now() }), // Last updated timestamp
			stripe_customer_id: S.String({ nullable: true, default: null })
		}),
		relationships: {
			user: S.RelationById('user', '$user_id') // Relation to the user
		},
		permissions: {
			user: {
				read: {
					filter: [['user_id', '=', '$role.userId']] // Users can only read their own logs
				}
			},
			admin: {
				read: { filter: [true] }, // Admins can read all user logs
				update: { filter: [true] } // Admins can modify user logs
			},
			temp: {},
			anon: {}
		}
	},
	transactions: {
		schema: S.Schema({
			id: S.Id(),
			user_id: S.String(), // User who made the transaction
			event_id: S.String({ nullable: true, default: null }),
			stripe_payment_intent: S.String({ nullable: true, default: null }), // Stripe Payment Intent ID
			transaction_type: S.String({
				enum: [
					TransactionType.PURCHASE,
					TransactionType.REFUND,
					TransactionType.BONFIRE_HOSTED
				] as const
			}), // Type of transaction
			num_log_tokens: S.Number(), // Number of logs purchased/refunded
			total_money_amount: S.Number({ default: null, nullable: true }),
			currency: S.String({ default: null, nullable: true }),
			created_at: S.Date({ default: S.Default.now() }) // Timestamp of transaction
			// user_donation: S.RelationOne('user_donations', {
			// 	// Link to possible donation
			// 	where: [['transaction_id', '=', '$id']]
			// })
		}),
		relationships: {
			user: S.RelationById('user', '$user_id'), // Relation to the user
			event: S.RelationById('events', '$event_id')
		},
		permissions: {
			user: {
				read: {
					filter: [or([['user_id', '=', '$role.userId']])] // Users can only see their own transactions
				}
			},
			admin: {
				read: { filter: [true] } // Admins can see all transactions
			},
			temp: {},
			anon: {}
		}
	},
	non_profits: {
		schema: S.Schema({
			id: S.Id(),
			name: S.String(), // Name of the non-profit
			description: S.String({ nullable: true }), // Short description
			photo_url: S.String({ nullable: true }), // Public S3 path for a logo/photo
			website_url: S.String({ nullable: true }), // External website link
			effective_start_date: S.Date({ default: S.Default.now() }), // When the non-profit became eligible
			effective_end_date: S.Date({ nullable: true, default: null }), // When the non-profit is no longer eligible
			created_at: S.Date({ default: S.Default.now() }), // Timestamp when added
			updated_at: S.Date({ default: S.Default.now() }) // Timestamp for updates
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				insert: { filter: [true] },
				update: { filter: [true] }
			},
			user: {
				read: {
					filter: [true]
				}
			},
			temp: {
				read: {
					filter: [true]
				}
			},
			anon: {
				read: {
					filter: [true]
				}
			}
		}
	}
});
