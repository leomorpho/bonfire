<script lang="ts">
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { onMount } from 'svelte';
	import { Image } from '@unpic/svelte';
	import { ImagePlus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import BonfireNoInfoCard from './BonfireNoInfoCard.svelte';
	import GalleryItem from './GalleryItem.svelte';

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

		// Handle itemData for video and images
		lightbox.on('itemData', (e) => {
			const element = e.itemData.element;

			if (element && element.dataset.pswpIsVideo === 'true') {
				const videoURL = element.href;
				const imgPoster = element.dataset.pswpIsPoster || '';
				e.itemData = {
					html: `
                    <div class="pswp__item">
                        <video controls class="pswp__img" poster="${imgPoster}">
                            <source src="${videoURL}" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                        <div class="pswp__play-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="12,8 12,16 16,12" />
                            </svg>
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
				<a
					href={file.signed_url}
					data-pswp-width={file.w_pixel}
					data-pswp-height={file.h_pixel}
					data-pswp-is-video={file.file_type.startsWith('video/')}
				>
					<GalleryItem
						url={file.URL}
						wPixel={file.w_pixel}
						hPixel={file.h_pixel}
						fileName={file.file_name}
						blurhash={file.blurr_hash}
						fileType={file.file_type}
						preview={file.linked_file || null}
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
<a href="media/add">
	<Button class="flex w-full items-center justify-center ring-glow">
		<ImagePlus />Add to gallery
	</Button>
</a>

<style>
	/* There is a warning for these classes being unused, but that's because they're used indirectly by Photoswipe */
	/* Disable zoom cursor for PhotoSwipe lightbox */
	.pswp__img,
	.pswp__zoom-wrap,
	.pswp__viewport {
		cursor: pointer !important; /* Ensure regular pointer cursor */
	}
</style>
