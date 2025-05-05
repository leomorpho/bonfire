<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Image } from '@unpic/svelte';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { onMount } from 'svelte';

	let query = $state('');
	let images = $state([]);

	let lightbox: PhotoSwipeLightbox | null = $state(null);
	let lightboxInitialized = $state(false);

	const initializeLightbox = () => {
		// Clean up any existing lightbox instance
		if (lightbox) {
			lightbox.destroy();
			lightbox = null;
		}

		// Initialize a new lightbox instance
		lightbox = new PhotoSwipeLightbox({
			gallery: '.lightbox-gallery-container-unsplash',
			pswpModule: () => import('photoswipe'),
			showHideAnimationType: 'zoom' // Optional animation
		});

		// Handle itemData for video and images
		lightbox.on('itemData', (e) => {
			const element = e.itemData.element;

			if (element && element.dataset.pswpIsVideo === 'true') {
				const videoURL = element.href;
				const imgPoster = element.dataset.pswpIsPoster || '';
				e.itemData = {
					html: `
                   	<div class="flex items-center justify-center h-full w-full">
						<div class="relative max-w-full max-h-full">
							<video controls class="rounded-lg shadow-lg" poster="${imgPoster}">
								<source src="${videoURL}" type="video/mp4" />
								Your browser does not support the video tag.
							</video>
						</div>
					</div>
                `
				};

				// Disable zoom for video: remove zoom cursor
				e.itemData.mouseMovePan = false; // Disable pan/zoom gestures for videos
			}
		});

		// Listen for the 'opening' event to disable autoplay on videos
		lightbox.on('opening', () => {
			const videoElements = document.querySelectorAll('video');
			videoElements.forEach((video) => {
				// Remove autoplay to prevent videos from playing automatically
				video.removeAttribute('autoplay');
			});
		});

		lightbox.on('itemClick', (e) => {
			console.log('PhotoSwipe item clicked:', e);
		});

		lightbox.init();
		lightboxInitialized = true; // Mark as initialized
		console.log('lightbox initialized', lightbox);
	};

	const cleanupLightbox = () => {
		if (lightbox) {
			lightbox.destroy();
			lightbox = null;
			lightboxInitialized = false;
		}
	};

	onMount(() => {
		console.log('mounting lightbox');
		initializeLightbox();

		// Cleanup lightbox on component destroy
		return cleanupLightbox;
	});

	async function searchImages() {
		const response = await fetch(`/unsplash/search?query=${query}`);
		console.log('response ----> ', response);
		const data = await response.json();
		if (data.error) {
			console.error(data.error);
		} else {
			images = data.results;
		}
		initializeLightbox();
	}

	async function setBannerImage(image) {
		const response = await fetch(image.urls.regular);
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		// Set the banner image URL here
		console.log('Banner image URL:', url);
	}
</script>

<div class="mb-10 w-full justify-center">
	<h1>Search Unsplash Images</h1>
	<div class="flex w-full items-center space-x-1">
		<Input
			bind:value={query}
			placeholder="Search for images..."
			class="my-5 w-full dark:bg-slate-700 sm:w-3/4 "
		/>
		<Button disabled={query.length == 0} onclick={searchImages}>Search</Button>
	</div>

	<div
		class="lightbox-gallery-container-unsplash grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
	>
		{#each images as image}
			{#if lightboxInitialized}
				<a
					href={image.urls.full}
					class="gallery-item"
					data-pswp-width={image.width}
					data-pswp-height={image.height}
					data-pswp-is-video={false}
				>
					{@render imageRendered(image)}
				</a>
			{:else}
				{@render imageRendered(image)}
			{/if}
		{/each}
	</div>
</div>

{#snippet imageRendered(image)}
	<div
		class="relative aspect-[5/3] w-full overflow-hidden rounded-lg bg-gray-200 duration-300 animate-in fade-in zoom-in"
	>
		<Image
			height={250}
			src={image.urls.thumb}
			aspectRatio={image.width / image.height}
			class="h-full w-full object-cover"
			layout="fullWidth"
			alt={image.alt_description}
		/>
	</div>
{/snippet}
