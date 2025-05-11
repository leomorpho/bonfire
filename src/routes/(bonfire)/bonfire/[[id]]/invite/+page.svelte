<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { and, type TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import Check from 'lucide-svelte/icons/check';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn, formatHumanReadable } from '$lib/utils.js';
	import { UserRoundMinus, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import HorizRule from '$lib/components/HorizRule.svelte';
	import ProfileAvatar from '$lib/components/profile/profile-avatar/ProfileAvatar.svelte';
	import BackButton from '$lib/components/BackButton.svelte';

	let { eventId, currUserId, eventCreatorId } = $props();

	let client: TriplitClient;
	let attendeesLoading = $state(true);

	let currentInvitedUsers: any[] = $state([]);
	let currentNonInvitedUsers: any[] = $state([]);
	let selectedAttendee = $state<string | null>(null);
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	let inputRef = $state<HTMLInputElement>(null!);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromEventAttendeesQuery = client.subscribe(
			client.query('user').Where([
				and([
					// ['attendances.event_id', '!=', eventId],
					['id', '!=', currUserId] // Exclude the event creator
				])
			]),
			(results) => {
				currentNonInvitedUsers = results;
				console.log('currentNonInvitedUsers ->', currentNonInvitedUsers);
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
		currentNonInvitedUsers.find((attendee) => attendee.user_id === selectedAttendee)?.username ??
			'Select a friend...'
	);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<div class="mx-4 mb-16 flex flex-col items-center justify-center">
	<section class="mt-4 w-full sm:w-[450px]">
		<h1
			class="mb-5 flex w-full items-center justify-between rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white"
		>
			<BackButton />
			Manage Invitations
			<div></div>
		</h1>

		<Popover.Root bind:open>
			<Popover.Trigger
				bind:ref={triggerRef}
				class="w-full dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
			>
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
							{#if currentNonInvitedUsers.length > 10}
								<div
									class="flex w-full justify-center rounded-lg bg-green-200 text-sm dark:bg-green-600"
								>
									{currentNonInvitedUsers.length} attendees found
								</div>
							{/if}
							{#each currentNonInvitedUsers as nonInvitedUser}
								<Command.Item
									value={nonInvitedUser.username}
									onSelect={() => {
										selectedAttendee = nonInvitedUser.user_id;
										// promoteToAdmin(attendee.user_id);
										closeAndFocusTrigger();
									}}
								>
									<Check class={cn(selectedAttendee !== nonInvitedUser.user_id && 'text-transparent')} />
									{nonInvitedUser?.username || 'Unknown User'}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<HorizRule />

		<!-- {#if currentAdminAttendees.length > 0}
			<h1
				class="mb-5 mt-7 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white"
			>
				Current admins
			</h1>
			<div class="space-y-4">
				{#each currentAdminAttendees as adminAttendee (adminAttendee.user.id)}
					<Card.Root
						class="bg-slate-200/80 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800"
					>
						<Card.Header>
							<Card.Title class="flex items-center">
								<ProfileAvatar userId={adminAttendee.user?.id} baseHeightPx={40} />
								<span class="ml-2">
									{adminAttendee.user.username}
								</span>
							</Card.Title>
							{#if adminAttendee.admin_role}
								<Card.Description>
									Added on {formatHumanReadable(adminAttendee.admin_role.created_at)} by
									<span class="font-bold">
										{#if currUserId == adminAttendee.admin_role.added_by_user_id}
											you
										{:else}
											{adminAttendee.admin_role.added_by_user.username}
										{/if}
									</span>
								</Card.Description>
							{/if}
						</Card.Header>
						<Card.Footer class="mt-2 flex justify-between sm:mt-0">
							<Button class="invisible" variant="outline">Cancel</Button>
							<Button
								class="delete-admin rounded-full"
								onclick={() => {
									demoteToAttendee(adminAttendee.user_id);
								}}
								><UserRoundMinus />
							</Button>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{:else}
			<div class="mb-5 flex w-full justify-center">
				<div class="rounded-xl bg-white p-2 px-4 text-xs dark:bg-slate-700">No admins yet</div>
			</div>
		{/if} -->
	</section>
</div>
