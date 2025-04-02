<script lang="ts">
	import * as Label from '$lib/components/ui/label/index.js';
	import * as Switch from '$lib/components/ui/switch/index.js';
	import { toast } from 'svelte-sonner';

	export let permissionName: string;
	export let isGranted: boolean;
	export let isDeviceSubscribed: boolean;
	export let togglePermission: (permission: string) => Promise<void>;

	function translateToTitleCase(str: string) {
		const words = str.split('_'); // Split the string by underscores
		const firstWord = words[0].charAt(0).toUpperCase() + words[0].slice(1); // Capitalize the first letter of the first word
		const remainingWords = words.slice(1).join(' '); // Join the remaining words with spaces
		return firstWord + (remainingWords ? ' ' + remainingWords : ''); // Combine the first word with the remaining words
	}
</script>

<div class="flex w-full items-center justify-between space-x-2">
	<Label.Root class="sm:text-base" for={permissionName}>
		{translateToTitleCase(permissionName)}
	</Label.Root>
	<Switch.Root
		id={permissionName}
		bind:checked={isGranted}
		onclick={() => togglePermission(permissionName)}
		disabled={!isDeviceSubscribed}
	/>
</div>
