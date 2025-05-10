<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import Reminder from './Reminder.svelte';
	import ShowUsersWontBeReached from './ShowUsersWontBeReached.svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Loader from '$lib/components/Loader.svelte';

	let { eventId, eventName } = $props();
	let client: TriplitClient;
	let remindersLoading = $state(true);
	let reminders: any = $state([]);
	let eventStartTime = $state();

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromEventRemindersQuery = client.subscribe(
			client
				.query('events')
				.Where(['id', '=', eventId])
				.Select(['start_time'])
				.Include('event_reminders'),

			(results) => {
				if (results.length == 0) return;

				const event = results[0];

				// Sort the reminders by send_at in ascending order
				reminders = event.event_reminders.sort((a, b) => {
					const dateA = new Date(a.send_at);
					const dateB = new Date(b.send_at);
					return dateA.getTime() - dateB.getTime();
				});
				eventStartTime = event.start_time;
				console.log('-----.> reminders', reminders);
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
		<ShowUsersWontBeReached {eventId} />

		{#if eventStartTime}
			<div
				class="my-4 flex w-full justify-center rounded-xl bg-slate-200/80 py-2 text-base dark:bg-slate-800/80"
			>
				Your event is happening on {formatHumanReadable(eventStartTime)}
			</div>
		{/if}
		<div class="space-y-4">
			{#if reminders.length > 0}
				{#each reminders as reminder (reminder.send_at)}
					<Reminder
						id={reminder.id}
						text={reminder.text}
						sendAt={reminder.send_at}
						targetAttendeeStatuses={reminder.target_attendee_statuses}
						sentAt={reminder.sent_at}
						dropped={reminder.dropped}
						eventStartDatetime={eventStartTime}
						{eventName}
					/>
				{/each}
			{:else if remindersLoading}
				<Loader />
			{:else}
				<div class="flex w-full justify-center">
					<div class="rounded-xl bg-slate-800/80 p-2 text-center text-sm">
						Reminders only get created once the event is itself created.
					</div>
				</div>
			{/if}
		</div>
	</section>
</div>
