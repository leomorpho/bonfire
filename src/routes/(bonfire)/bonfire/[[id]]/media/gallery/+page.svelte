<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Image } from '@unpic/svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import SelectionArea from '@viselect/vanilla';
	import JSZip from 'jszip';
	import { Download } from 'lucide-svelte';

	let selectedImages: any = $state([]);
	let selection: any;

	function isMobile() {
		return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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
			if (selectedImages.length > 5) {
				// For many images, use ZIP
				await downloadAsZip();
			} else {
				// For few images, download individually
				downloadEachImage();
			}
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
				selectedImages.map(async (imgURL: string) => {
					const response = await fetch(imgURL);
					const blob = await response.blob();
					const fileName = imgURL.split('/').pop() || 'image';
					return new File([blob], fileName, { type: blob.type });
				})
			);

			// Trigger the native sharing sheet
			await navigator.share({
				title: 'Download Images',
				files
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

		// Add images to the ZIP
		await Promise.all(
			selectedImages.map(async (imgURL: string) => {
				const response = await fetch(imgURL);
				const blob = await response.blob();
				const fileName = imgURL.split('/').pop() || 'image';
				folder?.file(fileName, blob);
			})
		);

		// Generate the ZIP and download
		const content = await zip.generateAsync({ type: 'blob' });
		const zipFileName = 'selected-images.zip';

		const a = document.createElement('a');
		a.href = URL.createObjectURL(content);
		a.download = zipFileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	function downloadEachImage() {
		if (selectedImages.length === 0) {
			alert('No images selected!');
			return;
		}

		selectedImages.forEach(async (imgURL: string) => {
			const response = await fetch(imgURL);
			const blob = await response.blob();
			const fileName = imgURL.split('/').pop() || 'image';

			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		});
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
			console.log('Added:', changed.added);
			console.log('Removed:', changed.removed);

			// Add newly selected images
			// Add 'selected' class to newly selected elements
			changed.added.forEach((el) => {
				el.classList.add('border-blue-400');
				selectedImages.push(el.getAttribute('data-src'));
			});

			// Remove 'selected' class from unselected elements
			changed.removed.forEach((el) => {
				el.classList.remove('border-blue-400');
				const index = selectedImages.indexOf(el.getAttribute('data-src'));
				if (index > -1) selectedImages.splice(index, 1);
			});

			console.log('selectedImages', selectedImages);
		});

		return () => {
			// Cleanup
			selection.destroy();
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
					<div class="image-item rounded-xl border-2 border-transparent" data-src={file.URL}>
						<Image
							height={400}
							class="rounded-lg"
							src={file.URL}
							layout="constrained"
							aspectRatio={4 / 3}
							alt={file.file_name}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

{#if selectedImages.length > 0}
	<div class="fixed bottom-6 left-1/2 flex -translate-x-1/2 transform flex-col items-center">
		<button
			on:click={handleDownload}
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
</style>
