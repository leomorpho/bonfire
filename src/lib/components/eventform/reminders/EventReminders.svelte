<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import Reminder from './Reminder.svelte';

	let { eventId } = $props();
	let client: TriplitClient;
	let remindersLoading = $state(true);
	let reminders: any = $state([]);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromEventRemindersQuery = client.subscribe(
			client.query('event_reminders').Where(['event_id', '=', eventId]).Order('send_at', 'ASC'),
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
</script>

<div class="mx-4 mb-16 flex flex-col items-center justify-center">
	<section class="w-full sm:w-[450px]">
		<h1
			class="mb-5 flex w-full justify-center rounded-xl bg-white p-2 text-xl font-semibold dark:bg-slate-900 dark:text-white"
		>
			Reminders
		</h1>
		<div class="space-y-4">
			{#if reminders.length > 0}
				{#each reminders as reminder (reminder.id)}
					<Reminder
						id={reminder.id}
						text={reminder.text}
						sendAt={reminder.send_at}
						targetAttendeeStatuses={reminder.target_attendee_statuses}
						sentAt={reminder.sent_at}
						dropped={reminder.dropped}
						eventStartDatetime={reminder.event_start_datetime}
					/>
				{/each}
			{:else}
				<div class="flex w-full justify-center">
					<div class="rounded-xl bg-slate-800/80 p-2 text-base">
						There seems to be no reminders set up yet...
					</div>
				</div>
			{/if}
		</div>
	</section>
</div>
