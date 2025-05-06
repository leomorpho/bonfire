<script lang="ts">
	import { page } from '$app/stores';
	import BackButton from '$lib/components/BackButton.svelte';
	import BannerUploader from '$lib/components/main-bonfire-event/BannerUploader.svelte';
	import ImageSearcher from '$lib/components/main-bonfire-event/image-searcher/ImageSearcher.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Search } from 'lucide-svelte';
	import type { UnsplashAuthorInfo } from '$lib/types';

	let isSearchOpen = $state(false);
	let imageUrl = $state('');
	let unsplashImageDownloadCounterCallback = $state('');
	let unsplashAuthorInfo: UnsplashAuthorInfo | undefined | null = $state();

	const onSelectImage = (
		url: string,
		counterUrl: string,
		authorName: string,
		authorUsername: string
	) => {
		imageUrl = url;
		unsplashImageDownloadCounterCallback = counterUrl;
		const authorInfo: UnsplashAuthorInfo = {
			name: authorName,
			username: authorUsername
		};
		unsplashAuthorInfo = authorInfo;
		isSearchOpen = false;
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
							<ImageSearcher {onSelectImage} />
						</div>
					</Sheet.Description>
				</Sheet.Header>
			</Sheet.Content>
		</Sheet.Root>

		<div class="justify-center md:flex">
			<BannerUploader {imageUrl} {unsplashImageDownloadCounterCallback} {unsplashAuthorInfo} />
		</div>
	</section>
</div>
