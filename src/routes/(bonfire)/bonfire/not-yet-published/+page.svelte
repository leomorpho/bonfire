<script>
	import CenteredPage from '$lib/components/CenteredPage.svelte';
</script>

<CenteredPage>
	<div class="flex justify-center">
		<div class="mt-10 max-w-lg rounded-xl bg-slate-200 p-6 text-center shadow-md dark:bg-gray-700">
			<h1 class="text-xl font-semibold text-red-600 dark:text-red-400">This Event is Unpublished</h1>
			<p class="mt-3 text-gray-700 dark:text-gray-300">Only the event owner or an admin can publish it.</p>
			<p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Contact them to proceed.</p>
		</div>
	</div>
</CenteredPage>
