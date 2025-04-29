<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import AnnouncementForm from '$lib/components/announcements/AnnouncementForm.svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import SvgLoader from '$lib/components/SvgLoader.svelte';
	import { onMount } from 'svelte';
	import BackButton from '$lib/components/BackButton.svelte';

	let announcement = $state();
	let attendance = $state();

	onMount(() => {
		const init = async () => {
			let client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

			announcement = await client.fetchOne(
				client
					.query('announcement')
					.Where(['id', '=', $page.params.announcement_id])
					.Order('created_at', 'DESC')
			);

			attendance = await client.fetchOne(
				client.query('attendees').Where(['user_id', '=', $page.data.user.id])
			);
		};

		init();
	});
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px] md:w-[550px] lg:w-[650px]">
		<h2
			class="mb-2 flex w-full items-center justify-between rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900"
		>
			<BackButton url={`/bonfire/${$page.params.id}`} />
			<div>Update announcement</div>
			<div></div>
		</h2>
		{#if announcement}
			<AnnouncementForm
				mode="update"
				eventId={$page.params.id}
				announcement={announcement ? announcement : null}
				userId={$page.data.user.id}
				currentUserAttendeeId={attendance?.id}
			/>
		{:else}
			<div class="flex w-full justify-center">
				<SvgLoader />
			</div>
		{/if}
	</section>
</div>
