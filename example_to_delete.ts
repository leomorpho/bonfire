const event = {
	// Only creator can update everything and specifically general info
	id: 1,
	created_by_user_id: 1,
	status: 'active', // active, cancelled
	event_name: 'Birthday Bash',
	description: 'A fun-filled birthday party for all!',
	start_time: '2024-12-15T18:00:00Z',
	end_time: '2024-12-15T22:00:00Z',
	style: 'casual',
	overlay_color: '#FF5733',
	overlay_opacity: 0.8,
	visibility: 'private', // public, private
	num_attendees: 2,
	private: {
		location: '123 King Rd', // Only event creator can update
		attendance_limit: 100, // Only event creator can update
		attendees: [ // Anyone can add/remove themselves
			{
				id: 1,
				username: 'Mike',
				profile_image: 'mike-profile.jpg',
				status: 'coming',
				updated_at: '2024-12-06T10:00:00Z',
				seen_by_organizer: false
			},
			{
				id: 2,
				username: 'Jasmine',
				profile_image: 'jasmine-profile.jpg',
				status: 'coming',
				updated_at: '2024-12-06T10:30:00Z',
				seen_by_organizer: true
			}
		],
		announcements: [ // Only event creator can create/update/delete, all attendees can read
			{
				id: 1,
				content: "Don't forget to bring your party hats!",
				user_id: 1,
				created_at: '2024-12-05T09:00:00Z',
				seen_by_user_ids: [1, 2, 3]
			}
		],
		files: [ // Attendees can create/delete their own and read all
			{
				id: 1,
				file_key: 'birthday-banner.jpg',
				file_type: 'image',
				file_name: 'banner.jpg',
				h_pixel: 1080,
				w_pixel: 1920,
				size_in_bytes: 2048000,
				uploaded_at: '2024-12-06T12:00:00Z',
				uploader_id: 'user_12345'
			}
		],
		reminders: [ // Only event creator can create/update/delete, all attendees can read
			{
				outgoing_at: '2024-12-05T09:00:00Z'
			},
			{
				outgoing_at: '2024-12-05T09:00:00Z'
			}
		]
	}
};
