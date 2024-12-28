import { writable } from 'svelte/store';

export const announcementsStore = writable({
	announcementsSubset: [],
	allAnnouncements: [],
	announcementsLoading: true,
	totalCount: 0
});

export const updateAnnouncementsStore = (updateFn: (state: any) => void) => {
	announcementsStore.update(updateFn);
};