<script lang="ts">
	let { children } = $props();
</script>

<div class="flex flex-col items-center justify-center p-6">
	<div class="mx-4 mt-4 flex w-full flex-col justify-center sm:w-[500px] md:w-[600px] lg:w-[750px]">
		{@render children()}
	</div>
</div>
