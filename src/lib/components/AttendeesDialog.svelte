<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Plus, Trash2 } from 'lucide-svelte';
	import { ScrollArea } from './ui/scroll-area';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { ArrowRightFromLine, Frown, Meh, Smile } from '@lucide/svelte';
	import SearchableAttendeeList from './SearchableAttendeeList.svelte';
	import InvitationStatusView from './InvitationStatusView.svelte';

	let {
		numAttendeesGoing,
		allAttendeesGoing,
		numAttendeesMaybeGoing,
		allAttendeesMaybeGoing,
		numAttendeesNotGoing,
		allAttendeesNotGoing,
		numAttendeesInvited,
		allAttendeesInvited,
		numAttendeesLeft,
		allAttendeesLeft,
		numAttendeesRemoved,
		allAttendeesRemoved,
		showMaxNumPeople = 30,
		isCurrenUserEventAdmin = false,
		eventId = '',
		eventTitle = '',
		eventStartTime = '',
		eventEndTime = '',
		eventDescription = '',
		eventLocation = '',
		maxNumGuestsAllowedPerAttendee = 0,
		eventCreatorUserId = '',
		adminUserIds = new Set()
	} = $props();

	let isDialogOpen = $state(false);
	let shouldLoadContent = $state(false);

	$effect(() => {
		if (isDialogOpen) {
			setTimeout(() => {
				shouldLoadContent = true;
			}, 0);
		} else {
			shouldLoadContent = false;
		}
	});
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger
		id="see-attendees-dialog"
		class="flex items-center focus:outline-none focus-visible:ring-0"
	>
		<div class="flex items-center justify-center rounded-full bg-white p-1 px-2 dark:bg-slate-900">
			<Plus
				class={`h-4 w-4 sm:h-5 sm:w-5 ${allAttendeesGoing.length > showMaxNumPeople ? 'mr-1 ' : ''}`}
			/>
			{#if allAttendeesGoing.length > showMaxNumPeople}
				{allAttendeesGoing.length - showMaxNumPeople}
			{/if}
		</div></Dialog.Trigger
	>
	<Dialog.Content class="h-full sm:h-[90vh]">
		<!-- Only load content when dialog is open -->
		<ScrollArea>
			<Tabs.Root value="going-attendees-dialog" class="w-full">
				<div class="sticky top-0 z-[60] flex w-full justify-center">
					<Tabs.List>
						<Tabs.Trigger value="going-attendees-dialog"
							>{numAttendeesGoing} <Smile class="pl-1" /></Tabs.Trigger
						>
						<Tabs.Trigger value="maybe-attendees-dialog"
							>{numAttendeesMaybeGoing} <Meh class="pl-1" /></Tabs.Trigger
						>
						<Tabs.Trigger value="not-going-attendees-dialog"
							>{numAttendeesNotGoing} <Frown class="pl-1" /></Tabs.Trigger
						>
						{#if numAttendeesInvited > 0}
							<Tabs.Trigger value="invited-attendees-dialog"
								>{numAttendeesInvited}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="ml-1"
									><circle cx="12" cy="12" r="10" /><path
										d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
									/><path d="M12 17h.01" /></svg
								></Tabs.Trigger
							>
						{/if}
						{#if isCurrenUserEventAdmin}
							<Tabs.Trigger value="admin-invitation-status-dialog"
								>👁️ Invitations</Tabs.Trigger
							>
							<Tabs.Trigger value="admin-attendees-removed-dialog"
								>{numAttendeesRemoved} <Trash2 class="pl-1" /></Tabs.Trigger
							>
							<Tabs.Trigger value="admin-attendees-left-dialog" id="num-attendees-left-tab"
								>{numAttendeesLeft} <ArrowRightFromLine class="pl-1" /></Tabs.Trigger
							>
						{/if}
					</Tabs.List>
				</div>
				{#if isDialogOpen && shouldLoadContent}
					<Tabs.Content value="going-attendees-dialog">
						<SearchableAttendeeList
							attendees={allAttendeesGoing}
							title="Going"
							viewerIsEventAdmin={isCurrenUserEventAdmin}
							maxGuestsAllowed={maxNumGuestsAllowedPerAttendee}
							{eventTitle}
							{eventStartTime}
							{eventEndTime}
							{eventDescription}
							{eventLocation}
							{eventCreatorUserId}
							{adminUserIds}
						/>
					</Tabs.Content>
					<Tabs.Content value="maybe-attendees-dialog">
						<SearchableAttendeeList
							attendees={allAttendeesMaybeGoing}
							title="Maybe going"
							viewerIsEventAdmin={isCurrenUserEventAdmin}
							maxGuestsAllowed={maxNumGuestsAllowedPerAttendee}
							{eventTitle}
							{eventStartTime}
							{eventEndTime}
							{eventDescription}
							{eventLocation}
							{eventCreatorUserId}
							{adminUserIds}
						/>
					</Tabs.Content>
					<Tabs.Content value="not-going-attendees-dialog">
						<SearchableAttendeeList
							attendees={allAttendeesNotGoing}
							title="Not going"
							viewerIsEventAdmin={isCurrenUserEventAdmin}
							maxGuestsAllowed={maxNumGuestsAllowedPerAttendee}
							{eventTitle}
							{eventStartTime}
							{eventEndTime}
							{eventDescription}
							{eventLocation}
							{eventCreatorUserId}
							{adminUserIds}
						/>
					</Tabs.Content>
					<Tabs.Content value="invited-attendees-dialog">
						<SearchableAttendeeList
							attendees={allAttendeesInvited}
							title="Invited"
							viewerIsEventAdmin={isCurrenUserEventAdmin}
							maxGuestsAllowed={maxNumGuestsAllowedPerAttendee}
							{eventTitle}
							{eventStartTime}
							{eventEndTime}
							{eventDescription}
							{eventLocation}
							{eventCreatorUserId}
							{adminUserIds}
						/>
					</Tabs.Content>
					<Tabs.Content value="admin-attendees-removed-dialog">
						<SearchableAttendeeList
							attendees={allAttendeesRemoved}
							title="Removed by admins"
							viewerIsEventAdmin={isCurrenUserEventAdmin}
							showRemoveUser={false}
							maxGuestsAllowed={maxNumGuestsAllowedPerAttendee}
							{eventTitle}
							{eventStartTime}
							{eventEndTime}
							{eventDescription}
							{eventLocation}
							{eventCreatorUserId}
							{adminUserIds}
						/>
					</Tabs.Content>
					<Tabs.Content value="admin-invitation-status-dialog">
						<InvitationStatusView
							{eventId}
							{allAttendeesInvited}
						/>
					</Tabs.Content>
					<Tabs.Content value="admin-attendees-left-dialog">
						<SearchableAttendeeList
							attendees={allAttendeesLeft}
							title="Left the event"
							viewerIsEventAdmin={isCurrenUserEventAdmin}
							showRemoveUser={false}
							maxGuestsAllowed={maxNumGuestsAllowedPerAttendee}
							{eventTitle}
							{eventStartTime}
							{eventEndTime}
							{eventDescription}
							{eventLocation}
							{eventCreatorUserId}
							{adminUserIds}
						/>
					</Tabs.Content>
				{/if}
			</Tabs.Root>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>
