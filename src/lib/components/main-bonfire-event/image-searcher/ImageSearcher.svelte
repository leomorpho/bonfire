<script lang="ts">
	import KeyBoardShortcut from '$lib/components/KeyBoardShortcut.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import ImageResult from './ImageResult.svelte';

	let { onSelectImage } = $props();

	let query = $state('');
	let images = $state([]);
	let isSearching = $state(false);

	async function searchImages() {
		try {
			isSearching = true;
			const response = await fetch(`/unsplash/search?query=${query}`);
			// console.log('response ----> ', response);
			const data = await response.json();
			if (data.error) {
				console.error(data.error);
			} else {
				images = data.results;
			}
		} catch (e) {
			console.log('failed to search unsplash images', e);
		} finally {
			isSearching = false;
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
</script>

<KeyBoardShortcut
	key="Enter"
	callback={() => {
		document.getElementById('search-now')?.click();
	}}
/>

<div class="mb-10 w-full justify-center px-1">
	<div
		class="sticky top-0 z-[1000] my-5 flex w-full flex-col items-center space-x-1 space-y-1 sm:flex-row sm:space-y-0 text-xs"
	>
		<Input
			bind:value={query}
			placeholder="Search Unsplash..."
			class="w-full dark:bg-slate-700 sm:w-3/4 text-xs"
		/>
		<Button id="search-now" class="text-xs" disabled={query.length == 0} onclick={searchImages}>Search</Button>
	</div>

	{#if isSearching}
		<div class="flex h-[70vh] w-full items-center justify-center">
			<div class="loading loading-spinner mr-2 h-12 w-12"></div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-y-2">
			{#each images as image}
				<ImageResult {image} {setBannerImage} />
			{/each}
		</div>
	{/if}
</div>
