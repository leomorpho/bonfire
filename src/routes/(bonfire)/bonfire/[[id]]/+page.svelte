<script lang="ts">
	import { page } from '$app/stores';
	import { tempAttendeeSecretStore, tempAttendeeSecretParam } from '$lib/enums';
	import type { BannerInfo, EventTypescriptType } from '$lib/types';
	import Bonfire from '$lib/components/main-bonfire-event/Bonfire.svelte';
	import { fontStore } from '$lib/styles';
import { EventStatus } from '$lib/enums';

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
	let eventNumAttendeesInvited = $derived($page.data.numAttendeesInvited);
	let bannerInfo: BannerInfo = $state($page.data.bannerInfo);
	let maxNumGuestsAllowedPerAttendee: number = $state(event?.max_num_guests_per_attendee ?? 0);
	let isBringListEnabled: boolean = $state(event?.is_bring_list_enabled ?? false);
	let requireGuestBringItem: boolean = $state(event?.require_guest_bring_item ?? false);
	let isGalleryEnabled: boolean = $state(event?.is_gallery_enabled ?? false);
	let isMessagingEnabled: boolean = $state(event?.is_messaging_enabled ?? false);
	let isCuttoffDateEnabled: boolean = $state(event?.is_cut_off_date_enabled ?? false);
	let cuttoffDate = $state(event?.cut_off_date);
	let organization = $state(event?.organization);
	let eventStatus = $derived(event?.status ?? EventStatus.ACTIVE);

	if (tempAttendeeId) {
		tempAttendeeSecretStore.set(tempAttendeeId);
	}

	if (event?.font) {
		fontStore.set(JSON.parse(event?.font));
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
	{eventNumAttendeesInvited}
	eventMaxCapacity={event?.max_capacity}
	eventNumAnnouncements={$page.data.numAnnouncements}
	eventNumFiles={$page.data.numFiles}
	eventNumBringListItems={$page.data.numBringListItems}
	{bannerInfo}
	isUserAnAttendee={$page.data.isUserAnAttendee}
	jwt={$page.data.jwt}
	{tempAttendeeId}
	{tempAttendeeSecret}
	{maxNumGuestsAllowedPerAttendee}
	{isBringListEnabled}
	{requireGuestBringItem}
	{isGalleryEnabled}
	{isMessagingEnabled}
	{isCuttoffDateEnabled}
	{cuttoffDate}
	{organization}
	{eventStatus}
/>
