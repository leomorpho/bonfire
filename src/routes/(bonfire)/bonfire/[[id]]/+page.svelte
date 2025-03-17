<script lang="ts">
	import { page } from '$app/stores';
	import { tempAttendeeSecretStore, tempAttendeeSecretParam } from '$lib/enums';
	import type { BannerInfo, EventTypescriptType } from '$lib/types';
	import Bonfire from '$lib/components/main-bonfire-event/Bonfire.svelte';

	const showMaxNumPeople = 50;
	const tempAttendeeId = $page.data.tempAttendeeId;
	const tempAttendeeSecret = $page.url.searchParams.get(tempAttendeeSecretParam);

	let currUserId = $state($page.data.user ? $page.data.user.id : null);

	let event = $state<EventTypescriptType | null>($page.data.event);
	let eventId = $derived(event?.id);
	let eventCreatorUserId = $derived<string | undefined>(event?.user_id);
	let eventStartTime = $derived(event?.start_time);
	let eventEndTime = $derived(event?.end_time);
	let eventTitle = $derived(event?.title);
	let eventDescription = $derived(event?.description);
	let eventIsPublished = $derived(event?.is_published);
	let eventLocation = $derived(event?.location);
	let eventNumAttendeesGoing = $derived($page.data.numAttendingGoing);
	let bannerInfo: BannerInfo = $state($page.data.bannerInfo);

	if (tempAttendeeId) {
		tempAttendeeSecretStore.set(tempAttendeeId);
	}
</script>

<Bonfire
	{currUserId}
	eventOrganizerId={event?.organizer['id']}
	eventOrganizerUsername={event?.organizer['username']}
	{eventId}
	{eventCreatorUserId}
	{eventStartTime}
	{eventEndTime}
	{eventTitle}
	{eventDescription}
	{eventIsPublished}
	{eventLocation}
	{eventNumAttendeesGoing}
	eventMaxCapacity={event?.max_capacity}
	eventNumAnnouncements={$page.data.numAnnouncements}
	eventNumFiles={$page.data.numFiles}
	eventNumBringListItems={$page.data.numBringListItems}
	{bannerInfo}
	isUserAnAttendee={$page.data.isUserAnAttendee}
	jwt={$page.data.jwt}
	{tempAttendeeId}
	{tempAttendeeSecret}
	{showMaxNumPeople}
/>
