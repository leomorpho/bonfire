import type { NotificationType } from './enums';
import type { signinTable } from './server/database/schema';
import type { SvelteComponent } from 'svelte';

export type Link = {
	icon: typeof SvelteComponent;
	name: string;
	href: string;
};

export type Faq = {
	question: string;
	answer: string; // HTML
};

export type Signin = typeof signinTable.$inferInsert;

export type NotificationQueueEntry = {
	id: string;
	user_id: string;
	object_type: NotificationType;
	object_ids: string; // Comma-separated list of IDs
	event_id: string; // Event ID to validate associations
	sent_at: Date | null;
};

export type NotificationTypescriptType = {
	id: string;
	event_id: string;
	user_id: string;
	message: string;
	object_type: NotificationType;
	object_ids: string; // Comma-separated list of IDs
	created_at: Date | null;
	seen_at: Date | null;
	num_push_notifications_sent: number;
};

export type AttendeeTypescriptType = {
	id: string;
	event_id: string;
	user_id: string;
	status: string; // Restrict to the possible RSVP statuses
	updated_at: Date; // This field always has a default, so it won't be `null`
	seen_announcements?: Array<{ id: string; announcement_id: string }>; // Link to `seen_announcements`
	seen_gallery_items?: Array<{ id: string; gallery_item_id: string }>; // Link to `seen_gallery_items`
};

export type FileTypescriptType = {
	id: string;
	file_key: string; // S3 key for the file
	file_type: string; // e.g., 'image', 'video', 'gif'
	file_name: string;
	h_pixel?: number | null; // Nullable height in pixels
	w_pixel?: number | null; // Nullable width in pixels
	size_in_bytes: number; // File size in bytes
	uploaded_at: Date; // Defaults to the current date
	uploader_id: string; // ID of the uploader (attendee)
	event_id: string; // ID of the associated event
	seen_by?: Array<{ id: string; attendee_id: string }>; // Seen gallery items linking to attendees
};

export type AnnouncementTypescriptType = {
	id: string;
	content: string; // Announcement content
	created_at: Date; // Defaults to the current date
	user_id: string; // ID of the user who created the announcement
	event_id: string; // ID of the associated event
	seen_by?: Array<{ id: string; attendee_id: string }>; // Seen announcements linking to attendees
};

export type PushNotificationPayload = {
	title: string;
	body: string;
	icon?: string;
	badge?: number;
};
