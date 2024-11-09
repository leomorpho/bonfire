<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
    import { Clock } from 'lucide-svelte';

	// Generate times in 15-minute increments for 12-hour timescale
	const generateTimeSlots = () => {
		const times = [];
		let hour = 1;
		let minute = 0;
		for (let i = 0; i < 48; i++) {
			const time = `${hour < 10 ? `0${hour}` : hour}:${minute < 10 ? `0${minute}` : minute}`;
			times.push({ value: time, label: time });
			minute += 15;
			if (minute === 60) {
				minute = 0;
				hour += 1;
			}
			if (hour === 13) hour = 1; // Reset after 12
		}
		return times;
	};

	const timeSlots = generateTimeSlots();

	let selectedTime = undefined;
</script>

<!-- Time Selector Dropdown -->
<Select.Root bind:value={selectedTime}>
	<Select.Trigger class="w-[180px]">
        <Clock class="ml-1 mr-1 h-4 w-4 text-slate-500" />
		<Select.Value placeholder="Select Time" />
	</Select.Trigger>
	<Select.Content>
		<ScrollArea class="h-72 w-48 rounded-md ">
			<Select.Group>
				{#each timeSlots as time}
					<Select.Item value={time.value} label={time.label}>
						{time.label}
					</Select.Item>
				{/each}
			</Select.Group>
		</ScrollArea>
	</Select.Content>
</Select.Root>
