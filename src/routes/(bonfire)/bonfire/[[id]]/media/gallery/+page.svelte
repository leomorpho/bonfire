<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Image } from '@unpic/svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import SelectionArea from '@viselect/vanilla';
	import JSZip from 'jszip';
	import { Download } from 'lucide-svelte';
	import { SquareDashedMousePointer } from 'lucide-svelte';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { Button } from '$lib/components/ui/button/index.js';

	let selectedImages: any = $state([]);
	let selection: any;
	let selectionActive = $state(false);
	let lightbox: PhotoSwipeLightbox | null = $state(null);

	function isMobile() {
		return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
	}

	function toggleSelection() {
		selectionActive = !selectionActive;

		if (selectionActive) {
			lightbox?.destroy();
		} else {
			// Clear selectedImages and remove selection styling
			selectedImages = [];
			const selectedElements = document.querySelectorAll('.image-item.border-blue-400');
			selectedElements.forEach((el) => {
				el.classList.remove('border-blue-400');
			});

			lightbox = new PhotoSwipeLightbox({
				gallery: '.gallery-container',
				children: 'a', // Target that tag within the gallery container
				pswpModule: () => import('photoswipe'),
				showHideAnimationType: 'zoom' // Optional animation
			});

			lightbox.init();
		}
	}

	function selectAll() {
		const allImages = document.querySelectorAll('.image-item');
		allImages.forEach((el) => {
			const src = el.getAttribute('data-src');
			const name = el.getAttribute('data-name');
			if (src && name && !selectedImages.find((img) => img.src === src)) {
				el.classList.add('border-blue-400');
				selectedImages.push({ src, name });
			}
		});
		console.log('All images selected:', selectedImages);
	}

	function selectNone() {
		const selectedElements = document.querySelectorAll('.image-item.border-blue-400');
		selectedElements.forEach((el) => {
			el.classList.remove('border-blue-400');
		});
		selectedImages = [];
		console.log('Selection cleared');
	}

	// Function to handle download
	async function handleDownload() {
		if (selectedImages.length === 0) {
			alert('No images selected!');
			return;
		}

		if (isMobile() && navigator.canShare()) {
			// Mobile: Use Web Share API
			await shareImages();
		} else {
			// Desktop: Download as ZIP or individually
			await downloadAsZip();
		}
	}

	async function shareImages() {
		if (selectedImages.length === 0) {
			alert('No images selected!');
			return;
		}

		// Fetch and prepare files
		try {
			const files = await Promise.all(
				selectedImages.map(async ({ src, name }) => {
					const response = await fetch(src);
					if (!response.ok) {
						console.error(`Failed to fetch ${src}: ${response.statusText}`);
						return null;
					}
					const blob = await response.blob();
					console.log(`Blob type: ${blob.type}, Blob size: ${blob.size} bytes`);
					if (blob.size === 0) {
						console.error(`Blob is empty for ${src}`);
						return null;
					}
					return new File([blob], name, { type: blob.type });
				})
			);

			// Filter out any null files (failed fetches)
			const validFiles = files.filter((file) => file !== null);

			if (validFiles.length === 0) {
				alert('No valid images to share.');
				return;
			}

			// Trigger the native sharing sheet
			await navigator.share({
				title: 'Download Images',
				files: validFiles
			});
		} catch (error) {
			console.error('Sharing failed:', error);
			alert('Your device does not support sharing these images.');
		}
	}

	async function downloadAsZip() {
		if (selectedImages.length === 0) {
			alert('No images selected!');
			return;
		}

		const zip = new JSZip();
		const folder = zip.folder('selected-images');
		if (!folder) {
			console.error('Failed to create ZIP folder.');
			return;
		}

		// Add images to the ZIP
		await Promise.all(
			selectedImages.map(async ({ src, name }) => {
				try {
					const response = await fetch(src);
					if (!response.ok) {
						console.error(`Failed to fetch ${src}: ${response.statusText}`);
						return;
					}

					const blob = await response.blob();
					console.log(`Blob type: ${blob.type}, Blob size: ${blob.size} bytes`);
					if (blob.size === 0) {
						console.error(`Blob is empty for ${src}`);
						return;
					}

					folder.file(name, blob);
					console.log(`Added ${name} to folder`);
				} catch (error) {
					console.error(`Error fetching ${src}:`, error);
				}
			})
		);

		// Generate the ZIP and download
		try {
			const content = await zip.generateAsync({ type: 'blob' });
			const zipFileName = 'selected-images.zip';

			const a = document.createElement('a');
			a.href = URL.createObjectURL(content);
			a.download = zipFileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			console.log('ZIP download initiated successfully.');
		} catch (error) {
			console.error('Error generating ZIP:', error);
			alert('Failed to generate ZIP file.');
		}
	}

	onMount(() => {
		// Initialize SelectionArea
		selection = new SelectionArea({
			selectionAreaClass: 'selection-area',
			selectables: ['.image-item'], // Selector for images
			startareas: ['.gallery-container'], // Start selection only within this container
			behaviour: {
				overlap: 'invert',
				intersect: 'touch'
			}
		}).on('move', ({ store: { changed } }) => {
			if (!selectionActive) return;
			console.log('Added:', changed.added);
			console.log('Removed:', changed.removed);

			// Add newly selected images
			changed.added.forEach((el) => {
				el.classList.add('border-blue-400');
				const src = el.getAttribute('data-src');
				const name = el.getAttribute('data-name');
				if (src && name && !selectedImages.find((img) => img.src === src)) {
					selectedImages.push({ src, name });
				}
			});

			// Remove unselected images
			changed.removed.forEach((el) => {
				el.classList.remove('border-blue-400');
				const src = el.getAttribute('data-src');
				const index = selectedImages.findIndex((img) => img.src === src);
				if (index > -1) selectedImages.splice(index, 1);
			});

			console.log('selectedImages', selectedImages);
		});

		lightbox = new PhotoSwipeLightbox({
			gallery: '.gallery-container',
			children: 'a', // Target that tag within the gallery container
			pswpModule: () => import('photoswipe'),
			showHideAnimationType: 'zoom' // Optional animation
		});

		lightbox.init();

		return () => {
			// Cleanup
			selection.destroy();
			lightbox?.destroy(); // Cleanup when the component is destroyed
		};
	});
</script>

<div class="mx-4 mb-48 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[550px] md:w-[650px] lg:w-[950px]">
		<Breadcrumb.Root class="mb-10">
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/bonfire/${$page.params.id}`}>Event</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Gallery</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
		{#if $page.data.eventFiles}
			<div
				class="gallery-container selection-area my-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
			>
				{#each $page.data.eventFiles as file}
					<div
						class="image-item rounded-xl border-2 border-transparent"
						data-src={file.URL}
						data-name={file.file_name}
					>
						<a
							href={file.URL}
							class={selectionActive ? 'disabled-link' : ''}
							data-pswp-width="1200"
							data-pswp-height="800"
						>
							<Image
								height={400}
								class="rounded-lg"
								src={file.URL}
								layout="constrained"
								aspectRatio={4 / 3}
								alt={file.file_name}
							/>
						</a>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
<div class="fixed left-1/2 top-6 flex -translate-x-1/2 transform flex-col items-center">
	<Toggle aria-label="toggle selection" onclick={toggleSelection}>
		<!-- Button Icon -->
		<SquareDashedMousePointer class="h-6 w-6" />{selectionActive
			? 'Disable Selection'
			: 'Enable Selection'}
	</Toggle>
	{#if selectionActive}
		<div class="flex space-x-2 mt-2">
			<Button onclick={selectAll} class="text-xs p-2">Select All</Button>
			<Button onclick={selectNone} class="text-xs p-2">Select None</Button>
		</div>
	{/if}
</div>

{#if selectedImages.length > 0}
	<div class="fixed bottom-6 left-1/2 flex -translate-x-1/2 transform flex-col items-center">
		<button
			onclick={handleDownload}
			class="rounded-full bg-blue-500 p-4 text-white shadow-lg transition hover:bg-blue-600"
		>
			<!-- Button Icon -->
			<Download class="h-6 w-6" />
		</button>
		<span class="mt-2">Download {selectedImages.length} files</span>
	</div>
{/if}

<style>
	.selection-area {
		border-radius: 0.1em;
	}
	.gallery-container {
		user-select: none;
	}
	.disabled-link {
		pointer-events: none; /* Disables all mouse interactions */
		cursor: default; /* Changes the cursor to indicate no interaction */
	}
</style>
