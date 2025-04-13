<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Label from '$lib/components/ui/label/index.js';
	import * as Switch from '$lib/components/ui/switch/index.js';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import { CalendarDate, type DateValue } from '@internationalized/date';

	let { reminder } = $props();

	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
	});

	console.log('reminder', reminder);
	let sentdAtDateValue = $state(
		new CalendarDate(
			reminder.send_at.getFullYear(),
			reminder.send_at.getMonth() + 1, // JS months are zero-based
			reminder.send_at.getDate()
		)
	);

	const toggleReminder = async (reminderId: string, currentState: boolean) => {};

	const debouncedUpdate = async () => {};
</script>

<Card.Root class="bg-slate-100/80 dark:bg-slate-900/80 dark:text-white">
	<Card.Content class="text-base">
		<Input
			type="text"
			placeholder="Event Name"
			bind:value={reminder.text}
			class="w-full bg-white dark:bg-slate-900"
			disabled={!!reminder.sent_at}
		/>
		<p>
			<strong>Lead Time:</strong>
			{reminder.lead_time_in_hours_before_event_starts} hours
		</p>
		<p>
			<strong>Target Attendees:</strong>
			{Array.from(reminder.target_attendee_statuses).join(', ')}
		</p>
		<Datepicker bind:value={sentdAtDateValue} oninput={debouncedUpdate} />

		<p>
			<strong>Sent At:</strong>
			{reminder.sent_at ? new Date(reminder.sent_at).toLocaleString() : 'Not sent yet'}
		</p>
		<div class="flex w-full items-center justify-between space-x-2">
			<Label.Root class="sm:text-base" for={reminder.id}>Enabled</Label.Root>
			<Switch.Root
				id={reminder.id}
				checked={!reminder.dropped}
				onchange={() => toggleReminder(reminder.id, reminder.dropped)}
			/>
		</div>
	</Card.Content>
	<Card.Footer class="mt-2 flex justify-between sm:mt-0">
		<Button class="invisible" variant="outline">Cancel</Button>
	</Card.Footer>
</Card.Root>
