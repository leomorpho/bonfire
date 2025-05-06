import type { NotificationType } from './enums';
import type { signinTable } from './server/database/schema';
import type { SvelteComponent } from 'svelte';

export type Link = {
	icon: typeof SvelteComponent;
	name: string;
	href: string;
	id: string;
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
	object_ids_set: Set<string>;
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
	object_ids_set: Set<string>;
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

export type EventTypescriptType = {
	id: string;
	title: string;
	description?: string | null; // Nullable
	start_time: Date;
	end_time?: Date | null; // Nullable
	location?: string | null; // Nullable
	geocoded_location?: string | null | JSON; // Optional and nullable
	user_id: string; // ID of the user who created the event
	user: { id: string; [key: string]: any }; // Relation to `user`, replace `[key: string]: any` with actual fields if defined
	attendees: Array<AttendeeTypescriptType>; // Relation to attendees
	temporary_attendees: Array<AttendeeTypescriptType>; // Relation to temporary attendees
	announcements: Array<AnnouncementTypescriptType>; // Relation to announcements
	files: Array<FileTypescriptType>; // Relation to files
	viewers: Array<{ id: string; user_id: string; event_id: string }>; // Relation to event viewers
	style?: string | null; // Nullable
	overlay_color?: string | null; // Nullable and optional
	overlay_opacity?: number | null; // Nullable and optional
	max_capacity?: number | null;
};

export interface EventThread {
	id: string;
	event_id: string;
	name: string;
}

export interface User {
	id: string;
	name: string;
}

export interface EventMessageSeen {
	message_id: string;
	user_id: string;
	seen_at: string;
}

export interface EventMessage {
	id: string;
	thread_id: string;
	thread?: EventThread; // Relation to the thread
	user_id: string;
	user?: User; // Relation to the user
	parent_message_id?: string | null; // Supports future threading
	parent_message?: EventMessage | null; // Parent message relation
	content?: string | null; // Text content of the message
	media_key?: string | null; // If message contains media (image/video/audio)
	media_type?: string | null; // Type of media (image, video, gif, etc.)
	seen_by: EventMessageSeen[]; // Tracks who has seen the message
	created_at: string; // ISO timestamp when the message was sent
	updated_at?: string | null; // ISO timestamp when the message was edited
}

export enum BringListCountTypes {
	PER_PERSON = 'per_person',
	COUNT = 'count'
}

/** Type for Bring Items (things like "Coca Cola", "Buns", "Beers") */
export type BringItem = {
	id: string;
	event_id: string;
	name: string;
	unit: BringListCountTypes; // "per_person" or "count"
	quantity_needed: number;
	details?: string | null; // Additional item details
	created_by: string; // User ID of the creator (admin)
	created_at: string; // Timestamp of creation
	bring_assignments?: BringAssignment[]; // List of assignments (optional)
	total_brought?: number;
};

/** Type for Bring Assignments (who is bringing what) */
export type BringAssignment = {
	id: string;
	bring_item_id: string; // ID of the related bring item
	assigned_to: string; // User ID of the assigned attendee
	assigned_by?: string | null; // User ID of who assigned it (null if self-assigned)
	quantity: number; // Amount of the item the user is bringing
	created_at: string; // Timestamp of assignment creation
};

/**
 * Type definition for banner information.
 */
export type BannerInfo = {
	bannerIsSet: boolean;
	bannerSmallSizeUrl: string;
	bannerLargeSizeUrl: string;
	bannerBlurHash: string;
};

export type UserLogToken = {
	id: string;
	user_id: string; // User who owns the logs
	user?: { id: string }; // Relation to user
	num_logs: number; // Number of logs the user has
	updated_at: string; // Last updated timestamp (ISO string)
	stripe_customer_id?: string | null; // Stripe Customer ID (nullable)
};

export type LogTokenTransaction = {
	id: string;
	user_id: string; // User who made the transaction
	user?: { id: string }; // Relation to user
	stripe_payment_intent: string; // Stripe Payment Intent ID
	transaction_type: 'purchase' | 'refund'; // Type of transaction
	num_log_tokens: number; // Number of logs purchased/refunded
	created_at: string; // Timestamp of transaction (ISO string)
};

export interface TemporaryAttendeeChange {
	temporary_attendee_id: string;
	changed_by: string;
	changed_by_id_type: string;
	change_type: string;
	field_name?: string | null;
	old_value?: string | null;
	new_value?: string | null;
}

export interface AttendeeChange {
	attendee_id: string | null;
	changed_by: string;
	change_type: string;
	field_name?: string | null;
	old_value?: string | null;
	new_value?: string | null;
}

export interface FontSelection {
	name: string;
	style: string;
	cdn: string;
}

export type NotifierPermission = {
	id: string;
	user_id: string;
	event_id?: string; // Optional event_id
	permission: string;
	granted: boolean;
	created_at: Date;
};

export type PermissionsArray = NotifierPermission[];

export type UnsplashAuthorInfo = {
	name: string;
	username: string;
};
