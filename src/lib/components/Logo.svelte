<script lang="ts">
	import { PUBLIC_PROJECT_NAME } from '$env/static/public';
	import { FlameKindling } from 'lucide-svelte';

	let { styleClasses = '' } = $props();
</script>

<a href="/" class={`flex ${styleClasses}`}>
	<FlameKindling class="mr-3 h-10 w-10" />
	<div class="text-2xl font-bold sm:text-3xl">{PUBLIC_PROJECT_NAME}</div>
</a>
