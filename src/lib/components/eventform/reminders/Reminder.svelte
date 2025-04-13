<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Label from '$lib/components/ui/label/index.js';
	import * as Switch from '$lib/components/ui/switch/index.js';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import { CalendarDate } from '@internationalized/date';
	import SelectedTargetStatus from './SelectedTargetStatus.svelte';
	import { Status } from '$lib/enums';
	import { debounce } from 'lodash-es';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';

	// Destructure individual fields from props
	let { id, text, sendAt, targetAttendeeStatuses, sentAt, dropped, eventStartDatetime } = $props();

	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
	});

	let sentdAtDateValue = $state(
		new CalendarDate(
			sendAt.getFullYear(),
			sendAt.getMonth() + 1, // JS months are zero-based
			sendAt.getDate()
		)
	);

	const toggleReminder = async (reminderId: string, currentState: boolean) => {
		await updateEvent({ dropped: !currentState });
	};

	const updateEvent = async (updatedFields = {}) => {
		try {
			const updatedReminder = {
				...updatedFields,
				text,
				send_at: new Date(sentdAtDateValue.year, sentdAtDateValue.month - 1, sentdAtDateValue.day),
				// lead_time_in_hours_before_event_starts: calculateLeadTimeInHours(),
				target_attendee_statuses: new Set(selectedStatuses)
			};
			console.log('updatedReminder', updatedReminder);

			await client.http.update('event_reminders', id, updatedReminder);
			// Update local state with the updated fields
			Object.assign(updatedReminder, updatedFields);
		} catch (error) {
			console.error('Error updating reminder:', error);
		}
	};

	const debouncedUpdate = debounce(async () => {
		await updateEvent();
	}, 800); // Debounce delay: 800ms

	const calculateLeadTimeInHours = () => {
		const eventStartDate = new Date(eventStartDatetime);
		const sendAtDate = new Date(
			sentdAtDateValue.year,
			sentdAtDateValue.month - 1,
			sentdAtDateValue.day
		);
		const diffInMs = eventStartDate.getTime() - sendAtDate.getTime();
		return Math.round(diffInMs / (1000 * 60 * 60)); // Convert milliseconds to hours
	};

	const calculateLeadTimeInDays = () => {
		return Math.round(calculateLeadTimeInHours() / 24); // Convert hours to days
	};

	let selectedStatuses = $state([
		...(targetAttendeeStatuses.has(Status.GOING) ? [Status.GOING] : []),
		...(targetAttendeeStatuses.has(Status.MAYBE) ? [Status.MAYBE] : [])
	]);
</script>

<Card.Root class="bg-slate-100/80 dark:bg-slate-900/80 dark:text-white">
	<Card.Content class="space-y-2 text-base">
		<Input
			type="text"
			placeholder="Event Name"
			bind:value={text}
			class="w-full bg-white dark:bg-slate-900"
			disabled={!!sentAt}
			oninput={debouncedUpdate}
		/>
		<p>
			<strong>Lead Time:</strong>
			{calculateLeadTimeInDays()} days
		</p>
		<div class="flex">
			<strong>Target Attendees:</strong>
			<div class="flex w-full justify-center">
				<ToggleGroup.Root type="multiple" bind:value={selectedStatuses}>
					<ToggleGroup.Item
						onclick={debouncedUpdate}
						class="active:bg-green-500 data-[state=off]:bg-slate-500/20 data-[state=on]:bg-green-500"
						value={Status.GOING}
						aria-label="Toggle Going"
					>
						{Status.GOING}
					</ToggleGroup.Item>
					<ToggleGroup.Item
						onclick={debouncedUpdate}
						class="active:bg-green-500 data-[state=off]:bg-slate-500/20 data-[state=on]:bg-green-500"
						value={Status.MAYBE}
						aria-label="Toggle Maybe"
					>
						{Status.MAYBE}
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			</div>
		</div>

		<Datepicker bind:value={sentdAtDateValue} oninput={debouncedUpdate} />

		<p>
			<strong>Sent At:</strong>
			{sentAt ? new Date(sentAt).toLocaleString() : 'Not sent yet'}
		</p>
		<div
			class="flex w-full items-center justify-between space-x-2 rounded-xl bg-slate-100 p-2 px-3 dark:bg-slate-900"
		>
			<Label.Root class="sm:text-base" for={id}>Enabled</Label.Root>
			<Switch.Root {id} checked={!dropped} onchange={() => toggleReminder(id, dropped)} />
		</div>
	</Card.Content>
</Card.Root>
