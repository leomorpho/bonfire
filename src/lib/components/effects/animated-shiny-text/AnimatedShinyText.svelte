<script lang="ts">
	import { cn } from '$lib/utils';

	let { children, shimmerWidth = 100, cls = '' } = $props();
</script>

<p
	style:--shimmer-width="{shimmerWidth}px"
	class={cn(
		'mx-auto max-w-md text-slate-800/50 dark:text-slate-100/50 ',

		// Shimmer effect
		'animate-shimmer bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shimmer-width)_100%] [transition:background-position_2s_cubic-bezier(.6,.6,0,1)_infinite]',

		// Shimmer gradient
		'bg-gradient-to-r from-transparent via-black/80 via-50% to-transparent  dark:via-white/80',

		cls
	)}
>
	{@render children()}
</p>
