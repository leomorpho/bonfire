import { writable } from 'svelte/store';

export const announcementsStore = writable({
	allUnreadNotifications: [],
	notificationsLoading: true,
	totalCount: 0
});

export const updateNotificationsQuery = (newValues: {
	allUnreadNotifications?: any[];
	notificationsLoading?: boolean;
	totalCount?: number;
}) => {
	console.log('### Received allUnreadNotifications:', newValues.allUnreadNotifications);
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
