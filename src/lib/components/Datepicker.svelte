<script lang="ts">
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let { value = $bindable<DateValue | undefined>(), oninput } = $props();
	let contentRef = $state<HTMLElement | null>(null);
	let isPopupOpen = $state(false);
	let prevDateEntry = value;

	const closePopup = () => {
		isPopupOpen = false;
	};

	$effect(() => {
		if (value && prevDateEntry != value) {
			closePopup();
		}
	});
</script>

<Popover.Root bind:open={isPopupOpen}>
	<Popover.Trigger
		class={cn(
			buttonVariants({
				variant: 'outline',
				class: 'w-full justify-between text-left font-normal dark:bg-slate-900'
			}),
			!value && 'text-muted-foreground'
		)}
	>
		<CalendarIcon class="mr-2 size-4" />
		{value ? df.format(value.toDate(getLocalTimeZone())) : 'Pick a date'}
		<div></div>
	</Popover.Trigger>
	<Popover.Content bind:ref={contentRef} class="w-auto p-0">
		<Calendar type="single" bind:value {oninput}/>
	</Popover.Content>
</Popover.Root>
