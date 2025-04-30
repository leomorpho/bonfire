<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { useQuery } from '@triplit/svelte';
	import * as Card from '$lib/components/ui/card';
	import { snakeCaseToNormal } from '$lib/utils';
	import { HistoryChangesConstants } from '$lib/enums';
	import DateCard from '$lib/components/time/DateCard.svelte';
	import ChangedByTempUser from '../profile/profile-avatar/history/ChangedByTempUser.svelte';
	import ChangedByUser from '../profile/profile-avatar/history/ChangedByUser.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Ghost } from 'lucide-svelte';
	import AdminOnlySign from '../AdminOnlySign.svelte';

	let { eventId } = $props();

	console.log('eventId', eventId);
	const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

	let eventChanges: any = $state();
	let tempEventChanges: any = $state();

	eventChanges = useQuery(
		client,
		client
			.query('attendees_changes')
			.Where(['attendee.event_id', '=', eventId])
			.Include('attendee')
			.Order('change_timestamp', 'DESC')
	);

	tempEventChanges = useQuery(
		client,
		client
			.query('temporary_attendees_changes')
			.Where(['temporary_attendee.event_id', '=', eventId])
			.Order('change_timestamp', 'DESC')
	);

	// Combine and sort changes by change_timestamp
	let allChanges: any = $state([]);

	$effect(() => {
		if (eventChanges.results && tempEventChanges.results) {
			const combinedChanges = [...eventChanges.results, ...tempEventChanges.results];
			combinedChanges.sort(
				(a, b) => new Date(b.change_timestamp).getTime() - new Date(a.change_timestamp).getTime()
			);
			allChanges = combinedChanges;
		}
	});
</script>

{#if eventChanges.fetching || tempEventChanges.fetching}
	<p>Loading...</p>
{:else if eventChanges.error || tempEventChanges.error}
	<p>Error: {eventChanges.error?.message ?? tempEventChanges.error?.message}</p>
{:else if allChanges.length > 0}
	<div class="my-5 rounded-xl bg-slate-200/80 p-3 dark:bg-slate-800/80 sm:p-8">
		<h1 class="flex w-full justify-center text-2xl font-semibold">
			History <AdminOnlySign
				text={'Only admins can access the event history page'}
				class={'mx-2'}
			/>
		</h1>
		<p class="text-base">
			Note that you can also access each attendee's history by clicking on their profile picture in
			the main event view.
		</p>
	</div>

	{#each allChanges as change}
		<Card.Root
			class="my-3 bg-slate-200/80 py-1 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800"
		>
			<Card.Header>
				<Card.Title class="flex items-center justify-between">
					<!-- Date Section on the Left -->
					<div class="mr-2">
						<DateCard date={change.change_timestamp} />
					</div>
					{#if change.changed_by_id_type}
						<Popover.Root>
							<Popover.Trigger
								><div
									class="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 p-1 px-2 text-xs font-light text-black"
								>
									<Ghost class="h-4 w-4" />
								</div></Popover.Trigger
							>
							<Popover.Content class="flex justify-center">Temporary Account</Popover.Content>
						</Popover.Root>
					{/if}
					<!-- Text Section on the Right -->
					<div class="flex w-full flex-col items-start text-base font-normal">
						<span>
							<span class="font-bold">
								{#if change.changed_by_id_type && change.changed_by_id_type == HistoryChangesConstants.temporary_attendee_id}
									<ChangedByTempUser tempAttendeeId={change.changed_by} />
								{:else}
									<ChangedByUser userId={change.changed_by} />
								{/if}
							</span>
							{#if change.change_type == HistoryChangesConstants.change_update}
								changed {snakeCaseToNormal(change.field_name)} from
								<span class="font-bold">{snakeCaseToNormal(change.old_value)}</span>
								to
								<span class="font-bold">{snakeCaseToNormal(change.new_value)}</span>.
							{:else if change.change_type == HistoryChangesConstants.change_create}
								joined the event with status
								<span class="font-bold">{snakeCaseToNormal(change.new_value)}</span>.
							{:else if change.change_type == HistoryChangesConstants.change_delete}
								deleted
								<span class="font-bold">
									{#if change.changed_by_id_type}
										<ChangedByTempUser tempAttendeeId={change.temporary_attendee_id} />
									{:else}
										<ChangedByUser userId={change.attendee?.user_id} />
									{/if}
								</span>
								from the event.
							{/if}
						</span>
					</div>
				</Card.Title>
			</Card.Header>
			<Card.Footer></Card.Footer>
		</Card.Root>
	{/each}
{:else if allChanges.length == 0}
	<div class="flex w-full justify-center">No historical changes yet</div>
{/if}
