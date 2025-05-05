<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { page } from '$app/stores';
	import BackButton from '$lib/components/BackButton.svelte';
	import BannerUploader from '$lib/components/main-bonfire-event/BannerUploader.svelte';
	import ImageSearcher from '$lib/components/main-bonfire-event/image-searcher/ImageSearcher.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Search } from 'lucide-svelte';

	let isSearchOpen = $state(false);
	let imageUrl = $state('');

	const setImageUrl = (url: string) => {
		console.log('FUCK YEAH');
		imageUrl = url;
		isSearchOpen = false;
		console.log('imageUrl', imageUrl);
	};
</script>

<div class="flex flex-col items-center justify-center px-4">
	<section class="mt-8 w-full sm:w-4/5">
		<div
			class="my-6 flex items-center justify-between rounded-lg bg-white p-2 text-2xl font-semibold dark:bg-slate-800 dark:text-white"
		>
			<BackButton url={`/bonfire/${$page.params.id}`} />
			<h2>Set Banner</h2>
			<span></span>
		</div>

		<Sheet.Root bind:open={isSearchOpen}>
			<Sheet.Trigger class="mb-3 w-full">
				<div class="flex w-full justify-center">
					<Button><Search class="mr-1 h-5 w-5" /> Search an image on Unsplash</Button>
				</div>
			</Sheet.Trigger>
			<Sheet.Content>
				<Sheet.Header>
					<!-- <Sheet.Title>Search on Unsplash</Sheet.Title> -->
					<Sheet.Description class="h-screen overflow-scroll">
						<div class="flex w-full justify-center">
							<ImageSearcher {setImageUrl} />
						</div>
					</Sheet.Description>
				</Sheet.Header>
			</Sheet.Content>
		</Sheet.Root>

		<div class="md:flex justify-center">
			<BannerUploader {imageUrl} />
		</div>
	</section>
</div>
