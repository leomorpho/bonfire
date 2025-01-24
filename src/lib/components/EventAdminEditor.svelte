<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import Fuse from 'fuse.js';
	import { X } from 'lucide-svelte';
	import HorizRule from './HorizRule.svelte';

	let { eventId } = $props();

	let client: TriplitClient;
	let attendeesLoading = $state(true);

	let currentAdmins: any[] = $state([]);
	let currentNonAdminAttendees: any[] = $state([]);
	let isFilteredNonAdminAttendeesInitialized = $state(false);
	let selectedAttendee = $state<string | null>(null);
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	let inputRef = $state<HTMLInputElement>(null!);

	let fuse: Fuse<any>;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromEventAttendeesQuery = client.subscribe(
			client
				.query('attendees')
				.where([['event_id', '=', eventId]])
				.include('admin_role')
				.include('user')
				.build(),
			(results) => {
				// Separate attendees into admins and non-admins
				currentAdmins = results.filter((attendee) => attendee.admin_role !== null);
				currentNonAdminAttendees = results.filter((attendee) => attendee.admin_role === null);
				currentNonAdminAttendees.sort((a, b) => {
					return a.user.username.localeCompare(b.user.username);
				});

				console.log('currentNonAdminAttendees', currentNonAdminAttendees);
			},
			(error) => {
				console.error('Error fetching event:', error);
				attendeesLoading = true;
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					attendeesLoading = false;
				}
			}
		);

		return () => {
			// Cleanup
			unsubscribeFromEventAttendeesQuery();
		};
	});

	async function promoteToAdmin(userId: string) {
		try {
			// const response = await client.mutation('add_event_admin').execute({
			// 	event_id: eventId,
			// 	user_id: userId
			// });

			// if (response.success) {
			if (true) {
				const promotedUser = currentNonAdminAttendees.find(
					(attendee) => attendee.user_id === userId
				);
				if (promotedUser) {
					// Move user to admins list
					currentAdmins = [...currentAdmins, promotedUser];
					currentNonAdminAttendees = currentNonAdminAttendees.filter(
						(attendee) => attendee.user_id !== userId
					);
					selectedAttendee = null;
				}
			} else {
				console.error('Failed to promote user to admin:', response.error);
			}
		} catch (error) {
			console.error('Error promoting user to admin:', error);
		}
	}

	async function demoteToAttendee(userId: string) {
		try {
			// Uncomment and adjust the API call when ready
			// const response = await client.mutation('remove_event_admin').execute({
			// 	event_id: eventId,
			// 	user_id: userId
			// });

			// if (response.success) {
			if (true) {
				const demotedUser = currentAdmins.find((admin) => admin.user_id === userId);
				if (demotedUser) {
					// Move user to non-admin attendees list
					currentNonAdminAttendees = [...currentNonAdminAttendees, demotedUser];
					currentAdmins = currentAdmins.filter((admin) => admin.user_id !== userId);
					selectedAttendee = null;
				}
			} else {
				console.error('Failed to demote admin to attendee:', response.error);
			}
		} catch (error) {
			console.error('Error demoting admin to attendee:', error);
		}
	}

	// Synchronize input height with trigger button
	$effect(() => {
		resizeInputBox();
	});

	const resizeInputBox = () => {
		if (triggerRef && inputRef) {
			const triggerWidth = triggerRef.offsetWidth;
			inputRef.style.width = `${triggerWidth}px`;
		}
	};

	const selectedValue = $derived(
		currentNonAdminAttendees.find((attendee) => attendee.user_id === selectedAttendee)?.username ??
			'Select an attendee...'
	);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h1 class="mb-5 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold">
			Add an admin
		</h1>
		<Popover.Root bind:open>
			<Popover.Trigger bind:ref={triggerRef} class="w-full">
				{#snippet child({ props })}
					<Button
						variant="outline"
						class="w-[200px] justify-between"
						{...props}
						role="combobox"
						aria-expanded={open}
					>
						{selectedValue}
						<ChevronsUpDown class="opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-[200px] p-0">
				<Command.Root>
					<Command.Input placeholder="Search attendee..." bind:ref={inputRef} class="h-9" />
					<Command.List>
						<Command.Empty>No attendees found.</Command.Empty>
						<Command.Group>
							{#if currentNonAdminAttendees.length > 10}
								<div class="flex w-full justify-center rounded-lg bg-green-200 text-sm">
									{currentNonAdminAttendees.length} attendees found
								</div>
							{/if}
							{#each currentNonAdminAttendees as attendee}
								<Command.Item
									value={attendee.user.username}
									onSelect={() => {
										selectedAttendee = attendee.user_id;
										promoteToAdmin(attendee.user_id);
										closeAndFocusTrigger();
									}}
								>
									<Check class={cn(selectedAttendee !== attendee.user_id && 'text-transparent')} />
									{attendee.user?.username || 'Unknown User'}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<HorizRule />
		<h1 class="mb-5 mt-7 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold">
			Current admins
		</h1>
		{#if currentAdmins.length > 0}
			<ul>
				{#each currentAdmins as admin}
					<li class="mb-2 flex justify-between rounded-xl bg-blue-200 p-2">
						<div></div>
						{admin.user.username}
						<button
							class="hover:rounded-lg hover:bg-slate-100"
							onclick={() => {
								demoteToAttendee(admin.user_id);
							}}><X /></button
						>
					</li>
				{/each}
			</ul>{:else}
			<div class="mb-5 flex w-full justify-center">
				<div class="rounded-xl bg-white p-2">No admins yet</div>
			</div>
		{/if}
	</section>
</div>
