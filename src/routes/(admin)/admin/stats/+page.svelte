<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import CenteredPage from '$lib/components/CenteredPage.svelte';
	import AttendeesPerBonfire from '$lib/components/admin/stats/AttendeesPerBonfire.svelte';
	import CreatedPerDate from '$lib/components/admin/stats/CreatedPerDate.svelte';
</script>

<CenteredPage>
	<div
		class="my-6 flex items-center justify-between rounded-lg bg-slate-200 p-2 text-2xl font-semibold dark:bg-slate-800 dark:text-white"
	>
		<BackButton url="/admin" />
		<h2>Stats</h2>
		<span></span>
	</div>

	<CreatedPerDate title="User onboardings" modelName="user" dateFieldName="created_at" />
	<CreatedPerDate title="Event creations" modelName="events" dateFieldName="created_at" />
	<!-- <AttendeesPerBonfire title='Attendees per bonfire'/> -->
</CenteredPage>
