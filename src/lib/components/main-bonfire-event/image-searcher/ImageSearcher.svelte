<script lang="ts">
	import KeyBoardShortcut from '$lib/components/KeyBoardShortcut.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Image } from '@unpic/svelte';

	let { onSelectImage } = $props();

	let query = $state('');
	let images = $state([]);

	async function searchImages() {
		const response = await fetch(`/unsplash/search?query=${query}`);
		// console.log('response ----> ', response);
		const data = await response.json();
		if (data.error) {
			console.error(data.error);
		} else {
			images = data.results;
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
	<div class="sticky top-0 z-[1000] flex w-full items-center space-x-1">
		<Input
			bind:value={query}
			placeholder="Search Unsplash..."
			class="my-5 w-full dark:bg-slate-700 sm:w-3/4 "
		/>
		<Button id="search-now" disabled={query.length == 0} onclick={searchImages}>Search</Button>
	</div>

	<div class="lightbox-gallery-container-unsplash grid grid-cols-1 gap-y-2">
		{#each images as image}
			{@render imageRendered(image)}
		{/each}
	</div>
</div>

{#snippet imageRendered(image)}
	{console.log('image.urls', image.urls)}
	<button
		onclick={() => {
			setBannerImage(image);
		}}
		class="relative w-full overflow-hidden rounded-lg bg-gray-200 duration-300 animate-in fade-in zoom-in"
	>
		<Image
			src={image.urls.small_s3}
			aspectRatio={image.width / image.height}
			class="h-full w-full object-cover"
			layout="constrained"
			alt={image.alt_description}
		/>
	</button>
{/snippet}
