<script lang="ts">
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import BonfireNoInfoCard from './BonfireNoInfoCard.svelte';
	import GalleryItem from './GalleryItem.svelte';
	import { Images, Plus } from 'lucide-svelte';
	import Loader from '$lib/components/Loader.svelte';

	let { eventNumFiles, fileCount, eventFiles, loadEventFiles, rsvpStatus } = $props();
	let lightbox: PhotoSwipeLightbox | null = $state(null);
	let isLightboxInitialized = $state(false);
	let previousEventFiles: any[] = $state([]); // Track the previous `eventFiles`

	$effect(() => {
		console.log('eventFiles', eventFiles, 'isLightboxInitialized', isLightboxInitialized);
	});

	const createPhotoSwipe = () => {
		// Initialize a new lightbox instance
		const newLightbox = new PhotoSwipeLightbox({
			gallery: '.lightbox-gallery-container',
			children: 'a:not(.see-all-link)', // Exclude "See All" link
			pswpModule: () => import('photoswipe'),
			showHideAnimationType: 'zoom' // Optional animation
		});

		// // Use afterInit to ensure the lightbox is fully initialized
		// lightbox.on('afterInit', () => {
		// 	// Adjust the cursor after the lightbox is fully initialized
		// 	const pswpElement = document.querySelector('.pswp');
		// 	if (pswpElement) {
		// 		pswpElement.style.cursor = 'pointer'; // Set cursor to pointer after the lightbox is initialized
		// 	}

		// 	// Also ensure that all `.pswp__img` and `.pswp__viewport` elements have the correct cursor
		// 	const imgElements = document.querySelectorAll('.pswp__img, .pswp__viewport');
		// 	imgElements.forEach((el) => {
		// 		el.style.cursor = 'pointer'; // Set cursor to pointer for the image and viewport
		// 	});
		// });

		// // Handle itemData for video and images
		// lightbox.on('itemData', (e) => {
		// 	const element = e.itemData.element;

		// 	if (element && element.dataset.pswpIsVideo === 'true') {
		// 		const videoURL = element.href;
		// 		const imgPoster = element.dataset.pswpIsPoster || '';
		// 		e.itemData = {
		// 			html: `
		//            	<div class="flex items-center justify-center h-full w-full">
		// 				<div class="relative max-w-full max-h-full">
		// 					<video controls class="rounded-lg shadow-lg" poster="${imgPoster}">
		// 						<source src="${videoURL}" type="video/mp4" />
		// 						Your browser does not support the video tag.
		// 					</video>
		// 				</div>
		// 			</div>
		//         `
		// 		};

		// 		// Disable zoom for video: remove zoom cursor
		// 		e.itemData.mouseMovePan = false; // Disable pan/zoom gestures for videos
		// 	}
		// });

		// // Listen for the 'opening' event to disable autoplay on videos
		// lightbox.on('opening', () => {
		// 	const videoElements = document.querySelectorAll('video');
		// 	videoElements.forEach((video) => {
		// 		// Remove autoplay to prevent videos from playing automatically
		// 		video.removeAttribute('autoplay');
		// 	});
		// });

		// lightbox.on('itemClick', (e) => {
		// 	console.log('PhotoSwipe item clicked:', e);
		// });

		newLightbox.init();
		isLightboxInitialized = true; // Mark as initialized
		console.log('lightbox initialized', newLightbox);

		return newLightbox;
	};

	onMount(() => {
		lightbox = createPhotoSwipe();

		// Cleanup lightbox on component destroy
		return () => {
			lightbox?.destroy();
		};
	});

	const numFilesAnonView = `${eventNumFiles} ${eventNumFiles == 1 ? 'file' : 'files'}`;
</script>

<div class="flex w-full justify-between rounded-xl bg-white p-2 dark:bg-slate-900">
	<div></div>
	<div class="flex items-center font-semibold">
		<Images class="mr-2 !h-5 !w-5 shrink-0" /> Gallery
	</div>
	{#if rsvpStatus}
		<div class="flex items-center">
			{@render uploadButton()}
		</div>
	{:else}
		<div></div>
	{/if}
</div>

<div>
	{@render miniGallery(fileCount, eventFiles)}
</div>
{#if !rsvpStatus}
	<div class="my-2">
		<BonfireNoInfoCard text={numFilesAnonView} />
	</div>
{/if}

{#snippet miniGallery(fileCount: number, eventFiles: any)}
	{#if rsvpStatus && eventFiles.length == 0 && eventNumFiles == 0}
		<BonfireNoInfoCard text={'No photos/videos yet'} class="my-2" />
	{/if}
	<div class="lightbox-gallery-container">
		{#if eventFiles && rsvpStatus}
			<div class="my-2 grid grid-cols-2 gap-2">
				{#each eventFiles as file}
					<GalleryItem
						urlActive={isLightboxInitialized}
						url={file.URL}
						wPixel={file.w_pixel}
						hPixel={file.h_pixel}
						fileName={file.file_name}
						blurhash={file.blurr_hash}
						fileType={file.file_type}
						preview={file.linked_file || null}
					/>
				{/each}
				{#if rsvpStatus}
					{#if eventFiles.length > 2 && fileCount}
						<!-- "See All" Image -->
						<a href="media/gallery" class="see-all-link block">
							<div
								class="flex items-center justify-center rounded-lg bg-gray-200 text-center font-semibold dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 sm:text-lg"
								style="aspect-ratio: 5 / 3; width: 100%;"
							>
								See {fileCount} more
							</div>
						</a>
					{:else if eventFiles.length > 0}
						<a href="media/gallery" class="see-all-link block">
							<div
								class="flex items-center justify-center rounded-lg bg-gray-200/50 text-center font-semibold hover:bg-gray-300/50 dark:bg-slate-900/50 dark:text-white dark:hover:bg-slate-800/50 sm:text-lg"
								style="aspect-ratio: 5 / 3; width: 100%;"
							>
								See Gallery
							</div>
						</a>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet uploadButton()}
	<a href="media/add">
		<Button
			id="upload-new-media-btn"
			class="flex w-full items-center justify-center ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
		>
			<Plus />
		</Button>
	</a>
{/snippet}

<style>
	/* There is a warning for these classes being unused, but that's because they're used indirectly by Photoswipe */
	/* Disable zoom cursor for PhotoSwipe lightbox */
	.pswp__img,
	.pswp__zoom-wrap,
	.pswp__viewport {
		cursor: pointer !important; /* Ensure regular pointer cursor */
	}
</style>
