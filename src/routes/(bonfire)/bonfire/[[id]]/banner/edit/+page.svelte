<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { page } from '$app/stores';
	import BackButton from '$lib/components/BackButton.svelte';

	import BannerUploader from '$lib/components/main-bonfire-event/BannerUploader.svelte';
	import ImageSearcher from '$lib/components/main-bonfire-event/image-searcher/ImageSearcher.svelte';
	import { Search } from 'lucide-svelte';
	import { ImageUp } from '@lucide/svelte';
</script>

<div class="px-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-4/5">
		<div
			class="my-6 flex items-center justify-between rounded-lg bg-white p-2 text-2xl font-semibold dark:bg-slate-800 dark:text-white"
		>
			<BackButton url={`/bonfire/${$page.params.id}`} />
			<h2>Set Banner</h2>
			<span></span>
		</div>

		<Tabs.Root value="search" class="w-full">
			<div class="flex w-full justify-center">
				<Tabs.List>
					<Tabs.Trigger value="search"><Search class="mr-1 h-5 w-5" /> Search</Tabs.Trigger>
					<Tabs.Trigger value="upload"><ImageUp class="mr-1 h-5 w-5" /> Upload</Tabs.Trigger>
				</Tabs.List>
			</div>

			<Tabs.Content value="search">
				<div class="flex w-full justify-center">
					<ImageSearcher />
				</div>
			</Tabs.Content>
			<Tabs.Content value="upload">
				<div class="flex w-full justify-center">
					<BannerUploader />
				</div>
			</Tabs.Content></Tabs.Root
		>
	</section>
</div>
