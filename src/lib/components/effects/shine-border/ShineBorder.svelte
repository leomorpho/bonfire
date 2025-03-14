<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		children,
		borderRadius = 8,
		borderWidth = 1,
		duration = 14,
		color = ['#4FF9FF'],
		cls = ''
	} = $props();
</script>

<div
	style="
        --border-radius: {borderRadius}px;
      "
	class={cn(
		'relative grid min-h-[60px] w-fit min-w-[300px] place-items-center rounded-[var(--border-radius)] bg-white p-3 text-black dark:bg-black dark:text-white',
		cls
	)}
>
	<div
		style="
          --border-width: {borderWidth}px;
          --border-radius: {borderRadius}px;
          --shine-pulse-duration: {duration}s;
          --mask-linear-gradient: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          --background-radial-gradient: radial-gradient(transparent, transparent, {Array.isArray(
			color
		)
			? color.join(',')
			: color}, transparent, transparent);
        "
		class="before:bg-shine-size before:absolute before:inset-0 before:aspect-square before:size-full before:rounded-[var(--border-radius)] before:p-[var(--border-width)] before:will-change-[background-position] before:content-[''] before:![-webkit-mask-composite:xor] before:[background-image:var(--background-radial-gradient)] before:[background-size:300%_300%] before:![mask-composite:exclude] before:[mask:var(--mask-linear-gradient)] motion-safe:before:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear]"
	></div>
	<!-- This is Default Slot -->
	{@render children()}
</div>
