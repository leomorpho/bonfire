<script lang="ts">
	// Any TypeScript logic can go here if needed
	const { message = null, children = null } = $props();
</script>

<div class="center-screen">
	<p class="m-2 w-5/6 rounded-lg bg-slate-100 p-4 sm:w-2/3 sm:text-xl md:w-1/3">
		{#if message}
			{message}
		{/if}
		{#if children}
			{@render children()}
		{/if}
	</p>
</div>

<style>
	.center-screen {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh; /* Full viewport height */
		text-align: center; /* Align text in case it's multiline */
	}
</style>
