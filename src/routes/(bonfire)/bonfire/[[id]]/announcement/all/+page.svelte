<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import Annoucements from '$lib/components/Annoucements.svelte';
	import AnnouncementForm from '$lib/components/AnnouncementForm.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { onMount } from 'svelte';

	let userId = $state('');
	let client: TriplitClient;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		(async () => {
			userId = (await waitForUserId()) as string;
		})();
	})
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px] md:w-[550px] lg:w-[650px]">
		<Breadcrumb.Root class="bg-white rounded-xl p-2 mt-2 bg-opacity-95">
			<Breadcrumb.List class="text-xs sm:text-sm ml-3">
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/bonfire/${$page.params.id}`}>Event</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Announcements</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
		<div class="my-2">
			<Annoucements eventId={$page.params.id} currUserId={userId} maxCount={100} />
		</div>
	</section>
</div>
