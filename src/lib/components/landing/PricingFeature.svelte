<script lang="ts">
	import { Check } from 'lucide-svelte';

	let { featureText } = $props();
</script>

<li class="flex items-center space-x-2">
	<Check strokeWidth={2} class="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" />
	<div class="text-sm text-slate-900 dark:text-slate-100 sm:text-base">
		{featureText}
	</div>
</li>
