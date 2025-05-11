<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import { CalendarDate } from '@internationalized/date';
	import { maxSmsLenInChars, Status } from '$lib/enums';
	import { debounce } from 'lodash-es';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import TextAreaAutoGrow from '$lib/components/input/TextAreaAutoGrow.svelte';
	import { Check } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Switch from '$lib/components/ui/switch/index.js';
	import {
		calculateLeadTimeInDays,
		calculateLeadTimeInHours,
		generateReminderMessage
	} from '$lib/utils';

	// Destructure individual fields from props
	let { id, text, sendAt, targetAttendeeStatuses, sentAt, dropped, eventStartDatetime, eventName } =
		$props();

	let client: TriplitClient;
	let isEnabled = $state(!dropped);
	let eventStartCalendarDate = $derived(
		new CalendarDate(
			eventStartDatetime.getFullYear(),
			eventStartDatetime.getMonth() + 1, // Months are zero-based in JavaScript
			eventStartDatetime.getDate()
		)
	);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
	});

	let sendAtDateValue = $state(
		new CalendarDate(
			sendAt.getFullYear(),
			sendAt.getMonth() + 1, // JS months are zero-based
			sendAt.getDate()
		)
	);

	const updateEvent = async () => {
		const hour = eventStartDatetime.getHours();

		try {
			const updatedReminder = {
				text: text,
				dropped: !isEnabled,
				send_at: new Date(
					sendAtDateValue.year,
					sendAtDateValue.month - 1,
					sendAtDateValue.day,
					hour
				),
				lead_time_in_hours_before_event_starts: calculateLeadTimeInHours(
					eventStartDatetime,
					sendAt
				),
				target_attendee_statuses: new Set(selectedStatuses)
			};
			console.log('updatedReminder', updatedReminder);

			await client.http.update('event_reminders', id, updatedReminder);
			toast.success('Saved', { duration: 800, class: 'w-32', position: 'bottom-right' });
		} catch (error) {
			console.error('Error updating reminder:', error);
		}
	};

	const debouncedUpdate = debounce(async () => {
		await updateEvent();
	}, 800); // Debounce delay: 800ms

	let leadTimeInDays = $derived(calculateLeadTimeInDays(eventStartDatetime, sendAt));

	let selectedStatuses = $state([
		...(targetAttendeeStatuses.has(Status.GOING) ? [Status.GOING] : []),
		...(targetAttendeeStatuses.has(Status.MAYBE) ? [Status.MAYBE] : [])
	]);

	$effect(() => {
		if (sendAtDateValue) {
			const leadTimeInDays = calculateLeadTimeInDays(eventStartDatetime, sendAt);
			text = generateReminderMessage(leadTimeInDays, eventName);
		}
	});

	// Utility function to determine class names
	function getContainerClasses() {
		let baseClasses = 'flex items-center rounded-xl p-2 transition-all duration-200 sm:px-3';
		if (dropped) {
			return `${baseClasses} bg-red-500 dark:bg-red-600 line-through`;
		}
		if (sentAt && isEnabled) {
			return `${baseClasses} bg-green-500 dark:bg-green-600`;
		}
		return `${baseClasses} bg-yellow-400 dark:bg-yellow-600`;
	}
</script>

<Card.Root
	class={`bg-slate-200/80 dark:bg-slate-900/80 dark:text-white ${dropped ? 'line-through' : ''}`}
>
	<Card.Content class="space-y-3 text-base sm:space-y-4">
		<div class="flex w-full items-center justify-center text-sm">
			<div class={getContainerClasses()}>
				{#if sentAt}
					<Check class="mr-2 h-4 w-4" />
					<strong class="mr-1">Sent on</strong>
					{sentAt ? new Date(sentAt).toLocaleString() : 'Not sent yet'}
				{:else}
					<strong>Sending {leadTimeInDays} {leadTimeInDays > 1 ? 'days' : 'day'} ahead</strong>
				{/if}
				<div class="ml-2 flex items-center">
					<Switch.Root
						{id}
						checked={!dropped}
						onclick={() => {
							isEnabled = !isEnabled;
							debouncedUpdate();
						}}
						disabled={!!sentAt}
					/>
				</div>
			</div>
		</div>

		<TextAreaAutoGrow
			bind:value={text}
			placeholder=""
			oninput={debouncedUpdate}
			disabled={!!sentAt}
			class="w-full bg-white dark:bg-slate-900"
			maxLength={maxSmsLenInChars}
		/>

		<div class="flex justify-evenly text-sm">
			<strong class="flex">Target Attendees:</strong>
			<div class="flex w-full justify-center">
				<ToggleGroup.Root type="multiple" bind:value={selectedStatuses}>
					<ToggleGroup.Item
						onclick={debouncedUpdate}
						class="active:bg-green-500 data-[state=off]:bg-slate-500/20 data-[state=on]:bg-green-500"
						value={Status.GOING}
						aria-label="Toggle Going"
						disabled={true}
					>
						{Status.GOING}
					</ToggleGroup.Item>
					<ToggleGroup.Item
						onclick={debouncedUpdate}
						class="active:bg-green-500 data-[state=off]:bg-slate-500/20 data-[state=on]:bg-green-500"
						value={Status.MAYBE}
						aria-label="Toggle Maybe"
						disabled={true}
					>
						{Status.MAYBE}
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			</div>
		</div>

		<Datepicker
			bind:value={sendAtDateValue}
			oninput={debouncedUpdate}
			maxValue={eventStartCalendarDate}
		/>
	</Card.Content>
</Card.Root>
