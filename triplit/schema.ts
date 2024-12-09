import { EventStatus, AttendanceStatus } from '$lib/enums';
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
			events: S.RelationMany('events', {
				where: [['attendees.user_id', '=', '$id']]
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
				read: {
					filter: [
						or([
							['id', '=', '$role.userId'], // Can read own profile
							{
								// User has an events they attend that this other user also attends
								exists: {
									collectionName: 'attendees',
									where: [
										['user_id', '=', '$role.userId'], // Current user is an attendee
										['event_id', '=', '$1.event_id'] // Same event
									]
								}
							}
						])
					]
				},
				// Insertion only done in BE
				update: {
					filter: [['id', '=', '$role.userId']] // Users can only update their own profile images
				},
				delete: {
					filter: [['id', '=', '$role.userId']] // Users can only delete their own profile images
				}
			},
			anon: {}
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
				read: {
					filter: [
						or([
							['user_id', '=', '$role.userId'], // Can read their own images
							{
								// User has an events they attend that this other user also attends
								exists: {
									collectionName: 'attendees',
									where: [
										['user_id', '=', '$role.userId'], // Current user is an attendee
										['event_id', '=', '$1.event_id'] // Same event
									]
								}
							}
						])
					]
				},
				// Insertion and update only done in BE
				delete: {
					filter: [['user_id', '=', '$role.userId']] // Users can only delete their own profile images
				}
			},
			anon: {}
		}
	},
	events: {
		schema: S.Schema({
			id: S.Id(),
			created_by_user_id: S.String(), // Creator of the event
			created_by_user: S.RelationOne('user', {
				where: [['id', '=', '$created_by_user_id']]
			}), // Relation to the user table
			status: S.String({ default: EventStatus.ACTIVE }), // 'active', 'cancelled'
			event_name: S.String(),
			description: S.String({ nullable: true }),
			start_time: S.Date(),
			end_time: S.Date({ nullable: true }),
			style: S.String({ nullable: true }),
			overlay_color: S.String({ nullable: true }),
			overlay_opacity: S.Number({ nullable: true }),
			num_attendees: S.Number({ default: 0 }),
			event_private_id: S.String(),
			event_private: S.RelationOne('event_private', {
				where: [['event_id', '=', '$id']]
			}),
			attendees: S.RelationMany('attendees', {
				where: [['event_id', '=', '$id']]
			}),
			announcements: S.RelationMany('announcements', {
				where: [['event_id', '=', '$id']]
			}),
			files: S.RelationMany('files', {
				where: [['event_id', '=', '$id']]
			}),
			reminders: S.RelationMany('reminders', {
				where: [['event_id', '=', '$id']]
			})
		}),
		permissions: {
			admin: {
				read: { filter: [true] },
				update: { filter: [true] },
				delete: { filter: [true] }
			},
			user: {
				read: {
					filter: [
						or([
							// Case 1: Direct access by event ID if it exists
							['id', '=', '$id'],
							// Case 2: User is an attendee
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
						])
					]
				},
				update: {
					filter: [['created_by_user_id', '=', '$role.userId']] // Only creator can update
				},
				delete: {
					filter: [['created_by_user_id', '=', '$role.userId']] // Only creator can delete
				}
			}
		}
	},
	event_private: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String({ default: null, nullable: true }), // Link to the event
			event: S.RelationOne('events', { where: [['event_private_id', '=', '$id']] }),
			location: S.String(),
			attendance_limit: S.Number()
		}),
		permissions: {
			user: {
				read: {
					filter: [
						{
							exists: {
								collectionName: 'attendees',
								where: [
									['event_id', '=', '$event_id'], // Linked event
									['user_id', '=', '$role.userId'] // User is an attendee
								]
							}
						}
					]
				},
				update: {
					filter: [
						['event_id', '=', '$query.event_id'],
						['created_by_user_id', '=', '$role.userId']
					]
				}
			}
		}
	},
	attendees: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(),
			user_id: S.String(),
			status: S.String({ default: AttendanceStatus.DEFAULT }), // 'coming', 'not coming'
			updated_at: S.Date({ default: S.Default.now() }),
			seen_by_organizer: S.Boolean({ default: false }),
			user: S.RelationById('users', '$user_id'),
			event: S.RelationById('events', '$event_id')
		}),
		permissions: {
			user: {
				read: {
					filter: [
						or([
							// Case 1: Direct access by user ID if it exists
							['user_id', '=', '$role.userId'],
							// Case 2: User is an attendee and can thus see attendees for common events
							{
								exists: {
									collectionName: 'attendees',
									where: [
										['user_id', '=', '$role.userId'], // Current user is an attendee
										['event_id', '=', '$event_id']   // Same event
									]
								}
							}
						])
					]
				},
				insert: {
					filter: [['event_id', '=', '$query.event_id']] // Can RSVP
				},
				update: {
					filter: [['user_id', '=', '$role.userId']] // Update own status
				},
				delete: {
					filter: [['user_id', '=', '$role.userId']] // Remove themselves
				}
			}
		}
	},
	announcements: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(),
			content: S.String(),
			user_id: S.String(),
			created_at: S.Date({ default: S.Default.now() }),
			seen_by_user_ids: S.Set(S.String())
		}),
		permissions: {
			user: {
				read: {
					filter: [true]
				},
				insert: {
					filter: [
						['event_id', '=', '$query.event_id'],
						['created_by_user_id', '=', '$role.userId']
					]
				},
				update: {
					filter: [
						['event_id', '=', '$query.event_id'],
						['created_by_user_id', '=', '$role.userId']
					]
				},
				delete: {
					filter: [
						['event_id', '=', '$query.event_id'],
						['created_by_user_id', '=', '$role.userId']
					]
				}
			}
		}
	},
	files: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(),
			file_key: S.String(),
			file_type: S.String(),
			file_name: S.String(),
			h_pixel: S.Number({ nullable: true }),
			w_pixel: S.Number({ nullable: true }),
			size_in_bytes: S.Number(),
			uploaded_at: S.Date({ default: S.Default.now() }),
			uploader_id: S.String(),
			uploader: S.RelationById('users', '$uploader_id'),
			event: S.RelationById('events', '$event_id')
		}),
		permissions: {
			user: {
				read: {
					filter: [['event_id', '=', '$query.event_id']]
				},
				// Insertion only on BE
				delete: {
					filter: [['uploader_id', '=', '$role.userId']]
				}
			}
		}
	},
	reminders: {
		schema: S.Schema({
			id: S.Id(),
			event_id: S.String(),
			outgoing_at: S.Date()
		}),
		permissions: {
			user: {
				read: {
					filter: [['event_id', '=', '$query.event_id']]
				},
				insert: {
					filter: [
						['event_id', '=', '$query.event_id'],
						['created_by_user_id', '=', '$role.userId']
					]
				},
				update: {
					filter: [
						['event_id', '=', '$query.event_id'],
						['created_by_user_id', '=', '$role.userId']
					]
				},
				delete: {
					filter: [
						['event_id', '=', '$query.event_id'],
						['created_by_user_id', '=', '$role.userId']
					]
				}
			}
		}
	}
} satisfies ClientSchema;
