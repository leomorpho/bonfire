<script lang="ts">
	import KeyBoardShortcut from '$lib/components/KeyBoardShortcut.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { onMount } from 'svelte';
	import ImageResult from './ImageResult.svelte';

	let { onSelectImage } = $props();

	let query = $state('');
	let images = $state([]);
	let isLoading = $state(false);
	let currentPage = $state(1);
	let hasMoreImages = $state(false);
	let observer: IntersectionObserver;
	let scrollContainer: HTMLElement;

	async function searchImages(append = false) {
		if (isLoading) return;

		// Save the current scroll position
		const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

		try {
			isLoading = true;
			const response = await fetch(`/unsplash/search?query=${query}&page=${currentPage}`);
			// console.log('response ----> ', response);
			const data = await response.json();
			if (data.error) {
				console.error(data.error);
			} else {
				if (append) {
					images = [...images, ...data.results];
				} else {
					images = data.results;
				}
				hasMoreImages = data.results.length > 0;
				currentPage += 1;
			}
		} catch (e) {
			console.log('failed to search unsplash images', e);
		} finally {
			isLoading = false;

			// Restore the scroll position
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollTop;
			}
		}
	}

	async function setBannerImage(image) {
		const response = await fetch(image.urls.full);
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const downloadCounterUrl = image.links.download_location;
		const name = image.user.name;
		const username = image.user.username;
		onSelectImage(url, downloadCounterUrl, name, username);
	}

	$effect(() => {
		if (hasMoreImages) {
			const loaderElement = document.getElementById('load-more-unsplash-images');
			if (loaderElement) {
				observer = new IntersectionObserver(
					(entries) => {
						if (entries[0].isIntersecting && hasMoreImages) {
							searchImages(true);
						}
					},
					{
						rootMargin: '20px'
					}
				);
				observer.observe(loaderElement);
			}

			return () => {
				if (observer && loaderElement) {
					observer.unobserve(loaderElement);
				}
			};
		}
	});

	onMount(() => {
		scrollContainer = document.querySelector('.image-results-container');
	});
</script>

<KeyBoardShortcut
	key="Enter"
	callback={() => {
		document.getElementById('search-now')?.click();
	}}
/>

<div class="mb-10 w-full justify-center px-1">
	<div
		class="sticky top-0 z-[1000] my-5 flex w-full flex-col items-center space-x-1 space-y-1 text-xs sm:flex-row sm:space-y-0"
	>
		<Input
			bind:value={query}
			placeholder="Search Unsplash..."
			class="w-full text-xs dark:bg-slate-700 sm:w-3/4"
		/>
		<Button
			id="search-now"
			class="text-xs"
			disabled={query.length == 0}
			onclick={() => {
				searchImages();
			}}
		>
			Search
		</Button>
	</div>

	{#if isLoading && currentPage == 1}
		<div class="flex h-[70vh] w-full items-center justify-center">
			<div class="loading loading-spinner mr-2 h-12 w-12"></div>
		</div>
	{:else}
		<div class="image-results-container grid grid-cols-1 gap-y-2">
			{#each images as image (image.id)}
				<ImageResult {image} {setBannerImage} />
			{/each}
			{#if hasMoreImages}
				<div id="load-more-unsplash-images" class="py-4 text-center">Loading more images...</div>
			{/if}
		</div>
	{/if}
</div>
