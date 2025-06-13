<script lang="ts">
	import { page } from '$app/stores';
	import BackButton from '$lib/components/BackButton.svelte';
	import OrganizationBannerUploader from '$lib/components/organization/OrganizationBannerUploader.svelte';
	import ImageSearcher from '$lib/components/main-bonfire-event/image-searcher/ImageSearcher.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Search } from 'lucide-svelte';
	import type { UnsplashAuthorInfo } from '$lib/types';

	const { data } = $props();

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

	let isUnsplashEnabled = true;
</script>

<div class="flex flex-col items-center justify-center px-4">
	<section class="mt-8 w-full sm:w-4/5">
		<div
			class="my-6 flex items-center justify-between rounded-lg bg-white p-2 text-2xl font-semibold dark:bg-slate-800 dark:text-white"
		>
			<BackButton url={`/org/${$page.params.id}`} />
			<h2>Set Organization Banner</h2>
			<span></span>
		</div>

		{#if isUnsplashEnabled}
			<div class="flex w-full justify-center">
				<Sheet.Root bind:open={isSearchOpen}>
					<Sheet.Trigger class="mb-3">
						<Button class="bg-green-600 p-5 text-base text-white hover:bg-green-500 sm:text-lg"
							><Search class="mr-1 h-5 w-5" /> Search an image on Unsplash</Button
						>
					</Sheet.Trigger>
					<Sheet.Content class="p-2 pt-5">
						<Sheet.Header>
							<Sheet.Description class="h-screen overflow-scroll">
								<div class="flex w-full justify-center">
									<ImageSearcher {onSelectImage} />
								</div>
							</Sheet.Description>
						</Sheet.Header>
					</Sheet.Content>
				</Sheet.Root>
			</div>
		{/if}
		<div class="flex w-full justify-center">
			<OrganizationBannerUploader {imageUrl} {unsplashImageDownloadCounterCallback} {unsplashAuthorInfo} />
		</div>
	</section>
</div>