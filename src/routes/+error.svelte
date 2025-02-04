<script>
	export let error;
</script>

<div class="grid min-h-full place-items-center px-6 py-24 sm:py-32">
	<h1 class="text-error text-4xl font-bold text-center">
		{error?.status || 500}
	</h1>

	<p class="text-center text-base-content/80 text-lg mt-4">
		{#if error?.status === 404}
			The page you are looking for does not exist.
		{:else}
			An unexpected error occurred.
		{/if}
	</p>

	<p class="text-center mt-10">
		<a href="/" class="btn">Go back home</a>
	</p>
</div>
