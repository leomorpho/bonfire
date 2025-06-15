<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { FlowData } from '../flow-enums';

	let { data }: { data: FlowData } = $props();

	let eventName = $state(data.eventName || '');

	// Update the data when input changes
	$effect(() => {
		data.eventName = eventName.trim();
	});
</script>

<div class="space-y-4">
	<div>
		<Label for="event-name" class="text-base font-medium">Event Name</Label>
		<Input
			id="event-name"
			bind:value={eventName}
			placeholder="e.g., Summer BBQ Party, Team Building Workshop..."
			class="mt-2 text-lg"
			autofocus
		/>
		<p class="text-sm text-gray-500 mt-1">
			Choose a clear, descriptive name that will grab attention
		</p>
	</div>
</div>