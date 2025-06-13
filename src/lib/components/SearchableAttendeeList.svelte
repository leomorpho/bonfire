<script lang="ts">
	import ProfileAvatar from './profile/profile-avatar/ProfileAvatar.svelte';
	import BonfireNoInfoCard from './BonfireNoInfoCard.svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	let {
		attendees = [],
		title = '',
		showRemoveUser = true,
		viewerIsEventAdmin = false,
		maxGuestsAllowed = 0,
		eventTitle = '',
		eventStartTime = '',
		eventEndTime = '',
		eventDescription = '',
		eventLocation = '',
		eventCreatorUserId = '',
		adminUserIds = new Set(),
		emptyMessage = 'no one yet',
		showIcon,
		searchPlaceholder = 'Search attendees'
	} = $props();

	let listView = $state(true);
	let searchTerm = $state('');

	// Fuzzy search function
	const fuzzyMatch = (searchText: string, targetText: string): boolean => {
		if (!searchText.trim()) return true;
		
		const search = searchText.toLowerCase();
		const target = targetText.toLowerCase();
		
		// Direct substring match gets priority
		if (target.includes(search)) return true;
		
		// Fuzzy character matching
		let searchIndex = 0;
		for (let i = 0; i < target.length && searchIndex < search.length; i++) {
			if (target[i] === search[searchIndex]) {
				searchIndex++;
			}
		}
		return searchIndex === search.length;
	};

	// Filter attendees based on search term
	const filterAttendees = (attendees: any[], searchTerm: string) => {
		if (!searchTerm.trim()) return attendees;
		
		return attendees.filter(attendee => {
			// Handle different data structures
			const name = attendee.user?.username || attendee.name || '';
			return fuzzyMatch(searchTerm, name);
		});
	};

	let filteredAttendees = $derived(filterAttendees(attendees, searchTerm));
</script>

<div class="mb-3 mt-5">
	<h2 class="my-3 flex w-full items-center justify-center font-semibold">
		{title}
		{#if showIcon}
			{@render showIcon()}
		{/if}
		{#if searchTerm.trim() && filteredAttendees.length !== attendees.length}
			<span class="ml-2 text-sm text-gray-500">({filteredAttendees.length} of {attendees.length})</span>
		{/if}
	</h2>
	<div class="mb-2 flex justify-center space-x-2">
		<button
			onclick={() => (listView = false)}
			class={!listView ? 'font-semibold text-blue-500' : 'text-gray-500'}>Grid</button
		>
		<button
			onclick={() => (listView = true)}
			class={listView ? 'font-semibold text-blue-500' : 'text-gray-500'}>List</button
		>
	</div>
	<div class="mb-2 px-5">
		<input
			type="text"
			bind:value={searchTerm}
			placeholder={searchPlaceholder}
			class="mb-2 w-full rounded border px-2 py-1 dark:bg-gray-800 dark:text-white"
		/>
	</div>
	{#if filteredAttendees.length > 0}
		{#if !listView}
			<div class="mx-5 flex flex-wrap -space-x-2 space-y-2 text-black">
				{#each filteredAttendees as attendee (attendee.id || attendee.userId)}
					<div animate:flip out:fade={{ duration: 300 }}>
						<ProfileAvatar
							userId={attendee.user_id || attendee.userId}
							tempUserName={attendee.name}
							{viewerIsEventAdmin}
							userIsEventAdmin={attendee.user_id === eventCreatorUserId || adminUserIds.has(attendee.user_id)}
							attendanceId={attendee.id || attendee.attendeeId}
							baseHeightPx={60}
							numGuests={attendee.guest_count}
							userRsvpStatus={attendee.status}
							userGuestCount={attendee.guest_count || 0}
							maxGuestsAllowed={maxGuestsAllowed}
							{eventTitle}
							{eventStartTime}
							{eventEndTime}
							{eventDescription}
							{eventLocation}
							{showRemoveUser}
						/>
					</div>
				{/each}
			</div>
		{:else}
			<div class="mx-5 flex flex-col space-y-2 text-black">
				{#each filteredAttendees as attendee (attendee.id || attendee.userId)}
					<div class="flex items-center space-x-2">
						<ProfileAvatar
							userId={attendee.user_id || attendee.userId}
							tempUserName={attendee.name}
							{viewerIsEventAdmin}
							userIsEventAdmin={attendee.user_id === eventCreatorUserId || adminUserIds.has(attendee.user_id)}
							attendanceId={attendee.id || attendee.attendeeId}
							baseHeightPx={60}
							numGuests={attendee.guest_count}
							userRsvpStatus={attendee.status}
							userGuestCount={attendee.guest_count || 0}
							maxGuestsAllowed={maxGuestsAllowed}
							{eventTitle}
							{eventStartTime}
							{eventEndTime}
							{eventDescription}
							{eventLocation}
							{showRemoveUser}
							showNameInline={true}
						/>
					</div>
				{/each}
			</div>
		{/if}
	{:else if searchTerm.trim()}
		<BonfireNoInfoCard text={`No attendees found matching "${searchTerm}"`} />
	{:else}
		<BonfireNoInfoCard text={emptyMessage} />
	{/if}
</div>