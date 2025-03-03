<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import CenteredPage from '$lib/components/CenteredPage.svelte';
	import NonProfitManager from '$lib/components/nonprofits/NonProfitManager.svelte';
</script>

<CenteredPage>
	<div
		class="my-6 flex items-center justify-between rounded-lg bg-slate-200 p-2 text-2xl font-semibold dark:bg-slate-800 dark:text-white"
	>
		<BackButton url="/admin" />
		<h2>Non-profits</h2>
		<span></span>
	</div>

	<NonProfitManager />
</CenteredPage>
