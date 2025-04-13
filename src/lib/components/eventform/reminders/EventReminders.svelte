<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch/index.js';

	let { eventId } = $props();
	let client: TriplitClient;
	let remindersLoading = $state(true);
	let reminders: any = $state([]);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromEventRemindersQuery = client.subscribe(
			client.query('event_reminders').Where(['event_id', '=', eventId]),
			(results) => {
				reminders = results;
				remindersLoading = false;
			},
			(error) => {
				console.error('Error fetching event:', error);
				remindersLoading = false;
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					remindersLoading = false;
				}
			}
		);

		return () => {
			unsubscribeFromEventRemindersQuery();
		};
	});

	const toggleReminder = async (reminderId: string, currentState: boolean) => {
		try {
			await client.http.update('event_reminders', reminderId, {
				dropped: !currentState
			});
			reminders = reminders.map((reminder: any) =>
				reminder.id === reminderId ? { ...reminder, dropped: !currentState } : reminder
			);
		} catch (error) {
			console.error('Error toggling reminder:', error);
		}
	};
</script>

<div class="mx-4 mb-16 flex flex-col items-center justify-center">
	<section class="w-full sm:w-[450px]">
		<h1 class="mb-5 flex w-full justify-center rounded-xl bg-white p-2 text-xl font-semibold dark:bg-slate-900 dark:text-white">
			Reminders
		</h1>
		<div class="space-y-4">
			{#if reminders.length > 0}
				{#each reminders as reminder (reminder.id)}
					<Card.Root class="bg-slate-100/80 dark:bg-slate-900/80 dark:text-white">
						<Card.Header>
							<Card.Title class="flex items-center justify-between text-lg">
								<span>{reminder.text}</span>
								<Switch
									checked={!reminder.dropped}
									on:change={() => toggleReminder(reminder.id, reminder.dropped)}
								/>
							</Card.Title>
						</Card.Header>
						<Card.Content class="text-base">
							<p><strong>Lead Time:</strong> {reminder.lead_time_in_hours_before_event_starts} hours</p>
							<p><strong>Target Attendees:</strong> {Array.from(reminder.target_attendee_statuses).join(', ')}</p>
							<p><strong>Send At:</strong> {new Date(reminder.send_at).toLocaleString()}</p>
							<p><strong>Sent At:</strong> {reminder.sent_at ? new Date(reminder.sent_at).toLocaleString() : 'Not sent yet'}</p>
						</Card.Content>
						<Card.Footer class="mt-2 flex justify-between sm:mt-0">
							<Button class="invisible" variant="outline">Cancel</Button>
						</Card.Footer>
					</Card.Root>
				{/each}
			{:else}
				<div class="flex w-full justify-center">
					<div class="rounded-xl bg-slate-800/80 p-2 text-base">
						There seems to be no reminders set up...
					</div>
				</div>
			{/if}
		</div>
	</section>
</div>
