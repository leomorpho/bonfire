<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { useQuery } from '@triplit/svelte';
	import * as Card from '$lib/components/ui/card';
	import { formatHumanReadableHour, snakeCaseToNormal } from '$lib/utils';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { HistoryChangesConstants } from '$lib/enums';
	import ChangedByTempUser from './ChangedByTempUser.svelte';
	import ChangedByUser from './ChangedByUser.svelte';
	import DateCard from '$lib/components/time/DateCard.svelte';

	let { attendeeId, isTempUser = false } = $props();

	console.log('attendeeId', attendeeId, 'isTempUser', isTempUser);
	const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

	let attendee = $state();
	let attendeeChanges: any = $state();

	if (isTempUser) {
		attendee = useQuery(client, client.query('temporary_attendees').Where(['id', '=', attendeeId]));
		attendeeChanges = useQuery(
			client,
			client
				.query('temporary_attendees_changes')
				.Where(['temporary_attendee_id', '=', attendeeId])
				.Order('change_timestamp', 'DESC')
		);
	} else {
		attendee = useQuery(client, client.query('attendees').Where(['id', '=', attendeeId]));
		attendeeChanges = useQuery(
			client,
			client
				.query('attendees_changes')
				.Where(['attendee_id', '=', attendeeId])
				.Order('change_timestamp', 'DESC')
		);
	}
</script>

{#if attendeeChanges.fetching}
	<p>Loading...</p>
{:else if attendeeChanges.error}
	<p>Error: {attendeeChanges.error.message}</p>
{:else if attendeeChanges.results}
	<ScrollArea class="h-[80vh]">
		{#each attendeeChanges.results as change}
			<Card.Root
				class="my-3 bg-slate-100/80 py-1 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800"
			>
				<Card.Header>
					<Card.Title class="flex items-center justify-between">
						<!-- Date Section on the Left -->
						<div class="mr-2">
							<DateCard date={change.change_timestamp} />
						</div>

						<!-- Text Section on the Right -->
						<div class="flex flex-col items-start font-normal">
							<span>
								{#if change.changed_by_id_type && change.changed_by_id_type == HistoryChangesConstants.temporary_attendee_id}
									<ChangedByTempUser tempAttendeeId={change.changed_by} />
								{:else}
									<ChangedByUser userId={change.changed_by} />
								{/if}
								changed {snakeCaseToNormal(change.field_name)} from
								<span class="font-bold">{snakeCaseToNormal(change.old_value)}</span>
								to
								<span class="font-bold">{snakeCaseToNormal(change.new_value)}</span>.
							</span>
						</div>
					</Card.Title>
				</Card.Header>
				<Card.Footer></Card.Footer>
			</Card.Root>
		{/each}
	</ScrollArea>
{/if}
