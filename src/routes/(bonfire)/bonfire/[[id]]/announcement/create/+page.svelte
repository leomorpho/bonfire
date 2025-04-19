<script lang="ts">
	import { page } from '$app/stores';
	import AnnouncementForm from '$lib/components/announcements/AnnouncementForm.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px] md:w-[550px] lg:w-[650px]">
		<h2
			class="mb-2 flex w-full items-center justify-between rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900"
		>
			<BackButton url={`/bonfire/${$page.params.id}`} />
			<div>Create announcement</div>
			<div></div>
		</h2>

		<AnnouncementForm mode="create" eventId={$page.params.id} />
	</section>
</div>
