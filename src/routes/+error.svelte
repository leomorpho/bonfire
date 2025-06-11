<script>
	export let error;
</script>

<div class="grid min-h-full place-items-center px-6 py-24 sm:py-32">
	<h1 class="text-center text-4xl font-bold text-error">
		{error?.status || 500}
	</h1>

	<p class="text-base-content/80 mt-4 text-center text-lg">
		{#if error?.status === 404}
			The page you are looking for does not exist.
		{:else}
			An unexpected error occurred.
		{/if}
	</p>

	<p class="mt-10 text-center">
		<a href="/" class="btn">Go back home</a>
	</p>
</div>
