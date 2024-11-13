import { Schema as S, type ClientSchema } from '@triplit/client';

export const schema = {
	user: {
		schema: S.Schema({
			id: S.String(), // Drizzle-generated ID, linked here as a String
			user_id: S.String() // User ID to link back to Drizzle's user table
		})
	},
	events: {
		schema: S.Schema({
			id: S.Id(), // Auto-generated ID for events in Triplit
			title: S.String(), // Title of the event
			description: S.String({ nullable: true }), // Optional event description
			start_time: S.Date(), // Start time for the event
			end_time: S.Date({ nullable: true }), // Optional end time for the event
			location: S.String({ nullable: true }), // Optional location for the event

			// Relationship to the `user` collection
			user_id: S.String(),
			user: S.RelationById('user', '$user_id')
		})
	},
	comments: {
		schema: S.Schema({
			id: S.Id(), // Auto-generated ID for comments
			content: S.String(), // Comment content
			created_at: S.Date({ default: S.Default.now() }), // Timestamp for when the comment was created

			// Relations
			user_id: S.String(), // ID of the user who created the comment
			user: S.RelationById('user', '$user_id'), // Link back to the user collection

			event_id: S.String(), // ID of the related event
			event: S.RelationById('events', '$event_id'), // Link to the events collection

			parent_comment_id: S.String({ nullable: true }), // ID of the parent comment, if it's a reply
			parent_comment: S.RelationById('comments', '$parent_comment_id'), // Self-referential relationship for replies

			replies: S.RelationMany('comments', {
				// Relation to fetch replies for a comment
				where: [['parent_comment_id', '=', '$id']],
				limit: 2 // Limit depth to 2
			})
		})
	},
	images: {
		schema: S.Schema({
			id: S.Id(), // Auto-generated ID for images
			url: S.String(), // URL of the image
			uploaded_at: S.Date({ default: S.Default.now() }), // Timestamp for when the image was uploaded

			// Relations
			uploader_id: S.String(), // ID of the user who created the comment
			uploader: S.RelationById('user', '$user_id'), // Link back to the user collection

			event_id: S.String(), // ID of the related event
			event: S.RelationById('events', '$event_id') // Link to the events collection
		})
	}
} satisfies ClientSchema;
