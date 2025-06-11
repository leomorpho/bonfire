<script>
	let { children } = $props();
</script>

<div class="mb-5 flex w-full flex-row items-center justify-center text-xl font-medium">
	{@render children()}
</div>
