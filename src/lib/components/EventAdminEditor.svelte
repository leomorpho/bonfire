<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
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
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromEventAttendeesQuery = client.subscribe(
			client
				.query('attendees')
				.where([
					and([
						['event_id', '=', eventId],
						['user_id', '!=', eventCreatorId] // Exclude the event creator
					])
				])
				.include('admin_role', (rel) => rel('admin_role').include('added_by_user').build())
				.include('user')
				.build(),
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

			const promotedUser = currentNonAdminAttendees.find((attendee) => attendee.user_id === userId);
			if (promotedUser) {
				// Move user to admins list
				currentAdminAttendees = [...currentAdminAttendees, promotedUser];
				currentNonAdminAttendees = currentNonAdminAttendees.filter(
					(attendee) => attendee.user_id !== userId
				);
				selectedAttendee = null;
			}
			toast.success('Successfully added a new admin');
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
	<section class="mt-8 w-full sm:w-[450px]">
		<h1 class="mb-5 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold">
			Add an admin
		</h1>
		<Collapsible.Root class="mb-5 rounded-lg bg-slate-200">
			<Collapsible.Trigger class="flex w-full items-center justify-between space-x-4 px-4">
				<div class="invisible"></div>
				<h4 class="text-sm font-semibold">Admin Permissions</h4>
				<Button variant="ghost" size="sm" class="w-9 p-0">
					<ChevronsUpDown />
					<span class="sr-only">Toggle</span>
				</Button>
			</Collapsible.Trigger>
			<Collapsible.Content class="space-y-2">
				<ul class="ml-5 list-disc pl-5">
					<li class="rounded-md px-4 py-2 text-sm">Modify event details</li>
					<li class="rounded-md px-4 py-2 text-sm">
						Manage announcements (create, update, delete)
					</li>
					<li class="rounded-md px-4 py-2 text-sm">Remove attendees</li>
					<li class="rounded-md px-4 py-2 text-sm">
						Delete files that don’t belong in the bonfire
					</li>
				</ul>

				<hr class="my-8 mt-12 h-px border-0 bg-gray-200 dark:bg-gray-700" />

				<div class="flex justify-center px-4 text-sm font-semibold">Limitations</div>
				<ul class="ml-5 list-disc pl-5">
					<li class="rounded-md px-4 py-2 text-sm">Cannot assign or revoke admin roles</li>
					<li class="rounded-md px-4 py-2 text-sm">Cannot transfer account ownership</li>
				</ul>
			</Collapsible.Content>
		</Collapsible.Root>

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

		{#if currentAdminAttendees.length > 0}
			<h1
				class="mb-5 mt-7 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold"
			>
				Current admins
			</h1>
			<div class="space-y-4">
				{#each currentAdminAttendees as adminAttendee}
					<Card.Root class="">
						<Card.Header>
							<Card.Title>{adminAttendee.user.username}</Card.Title>
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
						<Card.Content>
							<form>
								<div class="grid w-full items-center gap-4"></div>
							</form>
						</Card.Content>
						<Card.Footer class="flex justify-between">
							<Button class="invisible" variant="outline">Cancel</Button>
							<Button
								class="delete-admin"
								onclick={() => {
									demoteToAttendee(adminAttendee.user_id);
								}}><UserRoundMinus /></Button
							>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{:else}
			<div class="mb-5 flex w-full justify-center">
				<div class="rounded-xl bg-white p-2 px-4 text-xs">No admins yet</div>
			</div>
		{/if}
	</section>
</div>
