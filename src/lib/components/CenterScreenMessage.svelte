<script lang="ts">
	// Any TypeScript logic can go here if needed
	const { message = null, children = null } = $props();
</script>

<div class="center-screen">
	<p
		class="m-2 w-5/6 rounded-2xl bg-slate-100 p-4 dark:bg-slate-900 dark:text-white sm:w-2/3 sm:p-7 sm:text-xl md:w-1/3 md:p-10"
	>
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
