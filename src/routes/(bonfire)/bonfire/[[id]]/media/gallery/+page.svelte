<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Image } from '@unpic/svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import SelectionArea from '@viselect/vanilla';
	import JSZip from 'jszip';
	import { Download, Trash2 } from 'lucide-svelte';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ImagePlus } from 'lucide-svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import { SquareMousePointer } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import CustomAlertDialogue from '$lib/components/CustomAlertDialog.svelte';
	import { toast } from 'svelte-sonner';

	let selectedImages: any = $state([]);
	let selection: any;
	let selectionActive = $state(false);
	let lightbox: PhotoSwipeLightbox | null = $state(null);

	console.log('isOwner', $page.data.isOwner);

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
				el.classList.add('border-transparent');
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
		handleSelectionChange(allImages, selectedImages);

		console.log('All images selected:', selectedImages);
	}

	function selectNone() {
		const selectedElements = document.querySelectorAll('.image-item.border-blue-400');
		selectedElements.forEach((el) => {
			el.classList.remove('border-blue-400');
			el.classList.add('border-transparent');
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

	async function handleDelete(id = null) {
		// Prepare the file IDs for deletion
		const selectedFileIds = id ? [id] : selectedImages.map((image) => image.id);

		if (!selectedFileIds || selectedFileIds.length === 0) {
			alert('No files selected for deletion.');
			return;
		}

		const response = await fetch(`delete`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileIds: selectedFileIds })
		});

		if (response.ok) {
			const result = await response.json();
			console.log('Files deleted:', result.deletedCount);

			// Remove corresponding DOM elements
			selectedFileIds.forEach((fileId) => {
				const node = document.querySelector(`.image-item[data-id="${fileId}"]`);
				if (node) {
					node.remove(); // Remove the node from the DOM
				}
			});

			// Update selectedImages array
			selectedImages = selectedImages.filter((image) => !selectedFileIds.includes(image.id));

			toast.success(`${id ? 'File' : 'Files'} deleted`);
		} else {
			toast.error('Failed to delete files, try again later');
			console.error('Failed to delete files:', await response.text());
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
		const folder = zip.folder('bonfire-images');
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

	// handleSelectionChange is called on every selection change to update the selected list of items.
	function handleSelectionChange(elements: Element[] | NodeListOf<Element>, targetArray: any[]) {
		elements.forEach((el) => {
			// Update element styles
			el.classList.remove('border-transparent');
			el.classList.add('border-blue-400');

			// Extract attributes
			const id = el.getAttribute('data-id');
			const src = el.getAttribute('data-src');
			const name = el.getAttribute('data-name');

			// Add to the target array if it doesn't already exist
			if (src && name && id && !targetArray.find((item) => item.id === id)) {
				targetArray.push({ src, name, id });
			}
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
			if (!selectionActive) return;
			console.log('Added:', changed.added);
			console.log('Removed:', changed.removed);

			// // Add newly selected images
			// changed.added.forEach((el) => {
			// 	el.classList.remove('border-transparent');
			// 	el.classList.add('border-blue-400');
			// 	const id = el.getAttribute('data-id');
			// 	const src = el.getAttribute('data-src');
			// 	const name = el.getAttribute('data-name');
			// 	if (src && name && id && !selectedImages.find((img) => img.id === id)) {
			// 		selectedImages.push({ src, name, id });
			// 	}
			// });

			handleSelectionChange(changed.added, selectedImages);

			// Remove unselected images
			changed.removed.forEach((el) => {
				el.classList.remove('border-blue-400');
				el.classList.add('border-transparent');
				const id = el.getAttribute('data-id');
				const index = selectedImages.findIndex((img) => img.id === id);
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
				class="gallery-container selection-area my-5 grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-5"
			>
				{#each $page.data.eventFiles as file}
					<div
						class="image-item rounded-xl border-4 border-transparent"
						data-id={file.id}
						data-uploader-id={file.uploader_id}
						data-src={file.URL}
						data-name={file.file_name}
					>
						<ContextMenu.Root>
							<ContextMenu.Trigger>
								<a
									href={file.URL}
									class={selectionActive ? 'disabled-link' : ''}
									data-pswp-width={file.w_pixel}
									data-pswp-height={file.h_pixel}
								>
									<Image
										height={file.h_pixel}
										class="rounded-lg"
										src={file.URL}
										layout="constrained"
										aspectRatio={5 / 3}
										alt={file.file_name}
									/>
								</a>
							</ContextMenu.Trigger>
							<ContextMenu.Content>
								<ContextMenu.Item>Download</ContextMenu.Item>
								{#if $page.data.isOwner || $page.data.user.id == file.uploader_id}
									<CustomAlertDialogue
										continueCallback={() => handleDelete(file.id)}
										dialogDescription="This action cannot be undone. This will permanently delete this file from our servers."
									>
										<ContextMenu.Item>Delete this file</ContextMenu.Item></CustomAlertDialogue
									>
								{/if}
								{#if $page.data.isOwner && selectedImages.length > 1}
									<CustomAlertDialogue
										continueCallback={() => handleDelete()}
										dialogDescription="This action cannot be undone. This will permanently delete these files from our servers."
									>
										<ContextMenu.Item>Delete all selected files</ContextMenu.Item
										></CustomAlertDialogue
									>
								{/if}
							</ContextMenu.Content>
						</ContextMenu.Root>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
<div class="fixed left-1/2 top-14 flex -translate-x-1/2 transform flex-col items-center">
	<div class="flex items-center justify-center space-x-2">
		<a href="add">
			<Toggle aria-label="toggle bold">
				<ImagePlus class="size-4" />Upload
			</Toggle>
		</a>
		<Toggle aria-label="toggle selection" onclick={toggleSelection}>
			<SquareMousePointer class="size-4" /> Select
		</Toggle>
	</div>
</div>

{#if selectionActive}
	<div class="fixed bottom-6 left-1/2 flex -translate-x-1/2 transform flex-col items-center">
		<div class="flex items-center space-x-2">
			<div class="flex flex-col justify-center space-y-1">
				<Button
					disabled={$page.data.eventFiles.length == selectedImages.length}
					onclick={selectAll}
					class="p-1 text-xs">Select All</Button
				>
				<Button disabled={selectedImages.length == 0} onclick={selectNone} class="p-1 text-xs"
					>Select None</Button
				>
			</div>
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<button
							disabled={selectedImages.length == 0}
							onclick={handleDownload}
							class="rounded-full p-4 text-white shadow-lg transition
							{selectedImages.length === 0 ? 'cursor-not-allowed bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'}"
						>
							<!-- Button Icon -->
							<Download class="h-6 w-6" />
						</button></Tooltip.Trigger
					>
					<Tooltip.Content>
						<p>Download</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
			{#if $page.data.isOwner}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<CustomAlertDialogue
								continueCallback={() => handleDelete()}
								disabled={selectedImages.length == 0}
								dialogDescription="This action cannot be undone. This will permanently delete these files from our servers."
								><button
									disabled={selectedImages.length == 0}
									class="rounded-full p-4 text-white shadow-lg transition
							{selectedImages.length === 0 ? 'cursor-not-allowed bg-red-100' : 'bg-red-500 hover:bg-red-600'}"
								>
									<!-- Button Icon -->
									<Trash2 class="h-6 w-6" />
								</button></CustomAlertDialogue
							>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Delete</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{/if}

			<!-- <span class="mt-2">Download {selectedImages.length} files</span> -->
		</div>
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
