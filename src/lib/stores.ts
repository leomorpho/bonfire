import { writable } from 'svelte/store';

export const announcementsStore = writable({
	allNotifications: [],
	notificationsLoading: true,
	totalCount: 0
});

export const updateNotificationsQuery = (newValues: {
	allNotifications?: any[];
	notificationsLoading?: boolean;
	totalCount?: number;
}) => {
	console.log('### Received allNotifications:', newValues.allNotifications);
	console.log('### Received notificationsLoading:', newValues.notificationsLoading);
	console.log('### Received totalCount:', newValues.totalCount);

	announcementsStore.update((state) => {
		// Merge new values into the current state
		return {
			...state,
			...newValues
		};
	});
};
