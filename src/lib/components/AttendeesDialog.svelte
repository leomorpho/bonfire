<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Plus, Trash2 } from 'lucide-svelte';
	import { ScrollArea } from './ui/scroll-area';
	import ProfileAvatar from './profile/profile-avatar/ProfileAvatar.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { ArrowRightFromLine, Frown, Meh, Smile } from '@lucide/svelte';
	import BonfireNoInfoCard from './BonfireNoInfoCard.svelte';

	let {
		numAttendeesGoing,
		allAttendeesGoing,
		numAttendeesMaybeGoing,
		allAttendeesMaybeGoing,
		numAttendeesNotGoing,
		allAttendeesNotGoing,
		numAttendeesLeft,
		allAttendeesLeft,
		numAttendeesRemoved,
		allAttendeesRemoved,
		showMaxNumPeople = 30,
		isCurrenUserEventAdmin = false
	} = $props();

	let isDialogOpen = $state(false);
	let shouldLoadContent = $state(false);
	let listView = $state(false);
	let searchTerm = $state('');

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

{#snippet attendees(
	attendees: any,
	statusName: string,
	attendeeType: string,
	showRemoveUser = true
)}
	<div class="mb-3 mt-5">
		<h2 class="my-3 flex w-full justify-center font-semibold">
			{statusName}
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
				placeholder="Search attendees"
				class="w-full border rounded px-2 py-1 mb-2"
			/>
		</div>
		{#if attendees.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).length >  0}
			{#if !listView}
				<div class="mx-5 flex flex-wrap -space-x-2 space-y-2 text-black">
					{#each attendees.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())) as attendee (attendee.id + attendeeType)}
						<div>
							<ProfileAvatar
								userId={attendee.user_id}
								tempUserName={attendee.name}
								viewerIsEventAdmin={isCurrenUserEventAdmin}
								attendanceId={attendee.id}
								numGuests={attendee.guest_count}
								{showRemoveUser}
								baseHeightPx={60}
							/>
						</div>
					{/each}
				</div>
			{:else}
				<div class="mx-5 flex flex-col space-y-2 text-black">
					{#each attendees.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())) as attendee (attendee.id + attendeeType)}
						<div class="flex items-center space-x-2">
							<ProfileAvatar
								userId={attendee.user_id}
								tempUserName={attendee.name}
								viewerIsEventAdmin={isCurrenUserEventAdmin}
								attendanceId={attendee.id}
								numGuests={attendee.guest_count}
								{showRemoveUser}
								baseHeightPx={60}
								showNameInline={true}
							/>
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<BonfireNoInfoCard text="no one yet" />
		{/if}
	</div>
{/snippet}

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
						{#if isCurrenUserEventAdmin}
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
						{@render attendees(allAttendeesGoing, 'Going', 'going')}
					</Tabs.Content>
					<Tabs.Content value="maybe-attendees-dialog">
						{@render attendees(allAttendeesMaybeGoing, 'Maybe going', 'maybe-going')}
					</Tabs.Content>
					<Tabs.Content value="not-going-attendees-dialog">
						{@render attendees(allAttendeesNotGoing, 'Not going', 'not-going')}
					</Tabs.Content>
					<Tabs.Content value="admin-attendees-removed-dialog">
						{@render attendees(allAttendeesRemoved, 'Removed by admins', 'removed')}
					</Tabs.Content>
					<Tabs.Content value="admin-attendees-left-dialog">
						{@render attendees(allAttendeesLeft, 'Left the event', 'left')}
					</Tabs.Content>
				{/if}
			</Tabs.Root>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>
