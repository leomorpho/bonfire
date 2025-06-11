<script lang="ts">
	let { children, clickCallback, value, ariaLabel, class: className = null } = $props();
</script>

<button
	onclick={clickCallback}
	class={`inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors 
    hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
    disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${className}`}
	{value}
	aria-label={ariaLabel}
>
	{@render children()}
</button>
