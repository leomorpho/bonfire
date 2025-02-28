<script>
	let { children } = $props();
</script>

<div class="flex w-full flex-row items-center justify-center mb-5 font-medium text-xl">
	{@render children()}
</div>
