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
	import HorizRule from './HorizRule.svelte';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	// import { createNewAdminNotificationQueueObject } from '$lib/notification_queue';
	import ProfileAvatar from './profile/profile-avatar/ProfileAvatar.svelte';
	import { slide } from 'svelte/transition';
	import CollapsibleContent from './CollapsibleContent.svelte';

	let { eventId, currUserId, eventCreatorId } = $props();

	let client: TriplitClient;
	let attendeesLoading = $state(true);

	let currentAdminAttendees: any[] = $state([]);
	let currentNonAdminAttendees: any[] = $state([]);
	let selectedAttendee = $state<string | null>(null);
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	let inputRef = $state<HTMLInputElement>(null!);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromEventAttendeesQuery = client.subscribe(
			client
				.query('attendees')
				.Where([
					and([
						['event_id', '=', eventId],
						['user_id', '!=', eventCreatorId] // Exclude the event creator
					])
				])
				.Include('admin_role', (rel) => rel('admin_role').Include('added_by_user'))
				.Include('user')
				,
			(results) => {
				// Separate attendees into admins and non-admins
				currentAdminAttendees = results.filter((attendee) => attendee.admin_role !== null);
				currentNonAdminAttendees = results.filter((attendee) => attendee.admin_role === null);
				currentNonAdminAttendees.sort((a, b) => {
					return a.user.username.localeCompare(b.user.username);
				});

				// console.log('currentNonAdminAttendees', currentNonAdminAttendees);
				// console.log('currentAdminAttendees', currentAdminAttendees);
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
			await client.insert('event_admins', {
				event_id: eventId,
				user_id: userId,
				added_by_user_id: currUserId
			});

			const response = await fetch(`/bonfire/${eventId}/admins/notify`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventId, userId })
			});

			let notificationSent = false;
			try {
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || 'Failed to send admin notification');
				}
				notificationSent = true;
			} catch (e) {
				console.error(
					`failed to send new admin notification for eventId ${eventId} and userId ${userId}`,
					e
				);
			}

			const promotedUser = currentNonAdminAttendees.find((attendee) => attendee.user_id === userId);
			if (promotedUser) {
				// Move user to admins list
				currentAdminAttendees = [...currentAdminAttendees, promotedUser];
				currentNonAdminAttendees = currentNonAdminAttendees.filter(
					(attendee) => attendee.user_id !== userId
				);
				selectedAttendee = null;
			}

			if (notificationSent) {
				toast.success('Successfully added a new admin and notified them');
			} else {
				toast.success('Successfully added a new admin');
			}
		} catch (error) {
			toast.error('Failed to add admin, please try again later or contact support');
			console.error('Error promoting user to admin:', error);
		}
	}

	async function demoteToAttendee(userId: string) {
		try {
			const demotedAttendee = currentAdminAttendees.find((admin) => admin.user_id === userId);
			if (demotedAttendee) {
				await client.delete('event_admins', demotedAttendee.admin_role.id);

				// Move user to non-admin attendees list
				currentNonAdminAttendees = [...currentNonAdminAttendees, demotedAttendee];
				currentAdminAttendees = currentAdminAttendees.filter((admin) => admin.user_id !== userId);
				selectedAttendee = null;
			}
			toast.success('Successfully removed an admin');
		} catch (error) {
			toast.error('Failed to remove admin, please try again later or contact support');
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

<div class="mx-4 mb-16 flex flex-col items-center justify-center">
	<section class="w-full sm:w-[450px]">
		<h1
			class="mb-5 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
		>
			Add an admin
		</h1>
		<Collapsible.Root class="mb-5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 dark:text-white">
			<Collapsible.Trigger class="flex w-full items-center justify-between space-x-4 px-4">
				<div class="invisible"></div>
				<h4 class="text-sm font-semibold">Admin Permissions</h4>
				<Button variant="ghost" size="sm" class="w-9 p-0">
					<ChevronsUpDown />
					<span class="sr-only">Toggle</span>
				</Button>
			</Collapsible.Trigger>
			<CollapsibleContent duration={300}>
				<div transition:slide={{ duration: 300 }} class="py-3">
					<ul class="ml-5 list-disc pl-5">
						<li class="rounded-md px-4 py-1 text-sm">Modify event details</li>
						<li class="rounded-md px-4 py-1 text-sm">
							Manage announcements (create, update, delete)
						</li>
						<li class="rounded-md px-4 py-1 text-sm">Remove attendees</li>
						<li class="rounded-md px-4 py-1 text-sm">
							Delete files that don’t belong in the bonfire
						</li>
					</ul>

					<div class="mt-5 flex justify-center px-4 text-sm font-semibold">Limitations</div>
					<ul class="ml-5 list-disc pl-5">
						<li class="rounded-md px-4 py-1 text-sm">Cannot assign or revoke admin roles</li>
						<li class="rounded-md px-4 py-1 text-sm">Cannot transfer account ownership</li>
					</ul>
				</div>
			</CollapsibleContent>
			<!-- <Collapsible.Content class="space-y-2 py-2" forceMount>
				<div transition:slide={{ duration: 300 }}>
					<ul class="ml-5 list-disc pl-5">
						<li class="rounded-md px-4 py-1 text-sm">Modify event details</li>
						<li class="rounded-md px-4 py-1 text-sm">
							Manage announcements (create, update, delete)
						</li>
						<li class="rounded-md px-4 py-1 text-sm">Remove attendees</li>
						<li class="rounded-md px-4 py-1 text-sm">
							Delete files that don’t belong in the bonfire
						</li>
					</ul>


					<div class="mt-5 flex justify-center px-4 text-sm font-semibold">Limitations</div>
					<ul class="ml-5 list-disc pl-5">
						<li class="rounded-md px-4 py-1 text-sm">Cannot assign or revoke admin roles</li>
						<li class="rounded-md px-4 py-1 text-sm">Cannot transfer account ownership</li>
					</ul>
				</div>
			</Collapsible.Content> -->
		</Collapsible.Root>

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
							{#if currentNonAdminAttendees.length > 10}
								<div
									class="flex w-full justify-center rounded-lg bg-green-200 text-sm dark:bg-green-600"
								>
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

		{#if currentAdminAttendees.length > 0}
			<h1
				class="mb-5 mt-7 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white"
			>
				Current admins
			</h1>
			<div class="space-y-4">
				{#each currentAdminAttendees as adminAttendee (adminAttendee.user.id)}
					<Card.Root class="bg-slate-100/80 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800">
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
		{/if}
	</section>
</div>
