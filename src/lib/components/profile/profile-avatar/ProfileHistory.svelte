<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { useQuery } from '@triplit/svelte';
	import * as Card from '$lib/components/ui/card';
	import ProfileAvatar from './ProfileAvatar.svelte';
	import { formatHumanReadable } from '$lib/utils';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';

	let { attendeeId, isTempUser = false } = $props();

	console.log('attendeeId', attendeeId, 'isTempUser', isTempUser);
	const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

	let attendee = $state();
	let attendeeChanges: any = $state();

	if (isTempUser) {
		attendee = useQuery(client, client.query('temporary_attendees').Where(['id', '=', attendeeId]));
		attendeeChanges = useQuery(
			client,
			client.query('temporary_attendees_changes').Where(['temporary_attendee_id', '=', attendeeId])
		);
	} else {
		attendee = useQuery(client, client.query('attendees').Where(['id', '=', attendeeId]));
		attendeeChanges = useQuery(
			client,
			client.query('attendees_changes').Where(['attendee_id', '=', attendeeId])
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
					<Card.Title class="flex items-center">
						<ProfileAvatar userId={change.changed_by} baseHeightPx={40} />
						<span class="ml-2">
							{change.changed_by}
						</span>
					</Card.Title>
					<Card.Description>
						Changed {change.field_name} from {change.old_value} to {change.new_value} on {formatHumanReadable(
							change.change_timestamp
						)}
					</Card.Description>
				</Card.Header>
			</Card.Root>
		{/each}
	</ScrollArea>
{/if}
