<script lang="ts">
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { onMount } from 'svelte';
	import { Image } from '@unpic/svelte';
	import { ImagePlus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import BonfireNoInfoCard from './BonfireNoInfoCard.svelte';

	let { fileCount, eventFiles } = $props();
	let lightbox: PhotoSwipeLightbox | null = $state(null);
	let lightboxInitialized = false;
	let previousEventFiles: any[] = $state([]); // Track the previous `eventFiles`

	const initializeLightbox = () => {
		// Clean up any existing lightbox instance
		if (lightbox) {
			lightbox.destroy();
			lightbox = null;
		}

		// Initialize a new lightbox instance
		lightbox = new PhotoSwipeLightbox({
			gallery: '.lightbox-gallery-container',
			children: 'a:not(.see-all-link)', // Exclude "See All" link
			pswpModule: () => import('photoswipe'),
			showHideAnimationType: 'zoom' // Optional animation
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

	$effect(() => {
		console.log('initializing lightbox in effect');
		if (eventFiles && JSON.stringify(eventFiles) !== JSON.stringify(previousEventFiles)) {
			console.log('Reinitializing lightbox reactively');
			previousEventFiles = [...eventFiles]; // Update the previous files
			initializeLightbox();
		}
	});
</script>

{#if eventFiles}
	{#if eventFiles.length > 0}
		<div class="lightbox-gallery-container my-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
			{#each eventFiles as file}
				<a href={file.signed_url} data-pswp-width={file.w_pixel} data-pswp-height={file.h_pixel}>
					<Image
						class="border-white-500 rounded-lg border-2"
						height={file.h_pixel}
						src={file.signed_url}
						layout="constrained"
						aspectRatio={5 / 3}
						alt={file.file_name}
						on:click={(e) => {
							if (!lightboxInitialized) {
								e.preventDefault(); // Prevent link from opening if lightbox is not ready
							}
						}}
					/>
				</a>
			{/each}
			{#if eventFiles.length > 2 && fileCount}
				<!-- "See All" Image -->
				<a href="media/gallery" class="see-all-link block">
					<div
						class="flex items-center justify-center rounded-lg bg-gray-200 text-center font-semibold sm:text-lg"
						style="aspect-ratio: 5 / 3; width: 100%;"
					>
						See {fileCount} more
					</div>
				</a>
			{:else}
				<a href="media/gallery" class="see-all-link block">
					<div
						class="flex items-center justify-center rounded-lg bg-gray-200 text-center font-semibold sm:text-lg"
						style="aspect-ratio: 5 / 3; width: 100%;"
					>
						See Gallery
					</div>
				</a>
			{/if}
		</div>
	{:else}
		<div class="my-2">
			<BonfireNoInfoCard text={'No photos/videos yet'} />
		</div>
	{/if}
{/if}
<a href="media/add"
	><Button class="flex w-full items-center justify-center ring-glow"
		><ImagePlus />Add to gallery</Button
	>
</a>
