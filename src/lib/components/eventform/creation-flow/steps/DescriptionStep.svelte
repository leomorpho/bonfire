<script lang="ts">
	import TipTapTextEditor from '$lib/components/input/tiptap/TipTapTextEditor.svelte';
	import type { FlowData } from '../flow-enums';
	import { FileText } from 'lucide-svelte';

	let { data }: { data: FlowData } = $props();

	let description = $state(data.description || '');

	// Update data when description changes
	$effect(() => {
		data.description = description;
	});

	function handleDescriptionChange(event: CustomEvent) {
		description = event.detail;
	}
</script>

<div class="space-y-4">
	<div>
		<TipTapTextEditor 
			bind:content={description}
			on:contentChange={handleDescriptionChange}
			placeholder="Describe your event... What should attendees expect? What should they bring? Any special instructions?"
			class="min-h-[200px]"
		/>
		<p class="text-sm text-gray-500 mt-2">
			💡 Tip: Include what attendees should expect, what to bring, parking info, or any special instructions
		</p>
	</div>

	{#if description && description.length > 10}
		<div class="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
			<div class="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
				<FileText class="h-4 w-4" />
				<span class="font-medium">Looking good!</span>
			</div>
			<p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
				Your event description will help attendees understand what to expect
			</p>
		</div>
	{/if}
</div>