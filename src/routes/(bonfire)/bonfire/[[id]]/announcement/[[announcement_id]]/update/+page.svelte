<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import AnnouncementForm from '$lib/components/AnnouncementForm.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { getFeTriplitClient } from '$lib/triplit';
	import { useQuery } from '@triplit/svelte';
	import SvgLoader from '$lib/components/SvgLoader.svelte';
	import { onMount } from 'svelte';

	let announcements = $state();

	onMount(() => {
		const init = async () => {
			let client = getFeTriplitClient($page.data.jwt) as TriplitClient;

			let announcementQuery = client
				.query('announcements')
				.where(['id', '=', $page.params.announcement_id])
				.order('created_at', 'DESC')
				.build();

			announcements = await client.fetchOne(announcementQuery);
		};

		init();
	});
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px] md:w-[550px] lg:w-[650px]">
		<Breadcrumb.Root class="bg-white rounded-xl p-2 mt-2 bg-opacity-95">
			<Breadcrumb.List class="text-xs sm:text-sm">
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/bonfire/${$page.params.id}`}>Event</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Update announcements</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
		{#if announcements}
			<AnnouncementForm
				mode="update"
				eventId={$page.params.id}
				announcements={announcements ? announcements : null}
			/>
		{:else}
			<SvgLoader />
		{/if}
	</section>
</div>
