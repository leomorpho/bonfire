<script>
	import { Copy, Check } from 'lucide-svelte';

	let { value } = $props();
	let copied = $state(false);

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};
</script>

<div class="relative flex items-center gap-2 rounded-md border bg-gray-100 p-2 dark:bg-gray-900">
	<span class="truncate font-mono text-xs text-gray-700 dark:text-gray-300">{value}</span>
	<button
		onclick={copyToClipboard}
		class="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
		aria-label="Copy to clipboard"
	>
		{#if copied}
			<Check class="h-4 w-4 text-green-600 dark:text-green-400" />
		{:else}
			<Copy class="h-4 w-4 text-gray-500 dark:text-gray-400" />
		{/if}
	</button>
</div>
