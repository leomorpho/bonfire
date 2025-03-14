<script lang="ts">
	import { cn } from '$lib/utils';

	let { children, cls, reverse = false, duration = 20, delay = 0, radius = 10, path = true } = $props();

</script>

{#if path}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		version="1.1"
		class="pointer-events-none absolute inset-0 h-full w-full"
	>
		<circle
			class="stroke-1 stroke-white/30"
			cx="50%"
			cy="50%"
			r={radius}
			fill="none"
			stroke-dasharray="4 4"
		/>
	</svg>
	<div
		style:--delay={delay}
		style:--duration={duration}
		style:--radius={radius}
		class={cn(
			'absolute flex h-full w-full transform-gpu animate-orbit items-center justify-center rounded-full border bg-black [animation-delay:calc(var(--delay)*1000ms)] dark:bg-white/30',
			{ '[animation-direction:reverse]': reverse },
			cls
		)}
	>
		{@render children?.()}
	</div>
{/if}
