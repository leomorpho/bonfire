<script lang="ts">
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { onMount } from 'svelte';
	import { Image } from '@unpic/svelte';
	import { ImagePlus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let { fileCount, eventFiles } = $props();
	let lightbox: PhotoSwipeLightbox | null = $state(null);

	onMount(() => {
		// Ensure lightbox initializes after DOM is rendered
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
	});
</script>

{#if eventFiles}
	<div class="lightbox-gallery-container my-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
		{#each eventFiles as file}
			<a href={file.URL} data-pswp-width={file.w_pixel} data-pswp-height={file.h_pixel}>
				<Image
					class="rounded-lg"
					height={file.h_pixel}
					src={file.URL}
					layout="constrained"
					aspectRatio={5 / 3}
					alt={file.file_name}
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
		{/if}
	</div>
{/if}
<a href="media/add"
	><Button variant="outline" class="flex w-full items-center justify-center"
		><ImagePlus />Add to gallery</Button
	>
</a>
