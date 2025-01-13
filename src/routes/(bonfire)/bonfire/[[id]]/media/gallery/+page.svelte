<script lang="ts">
	import { tempAttendeeIdUrlParam } from '$lib/enums';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import SelectionArea from '@viselect/vanilla';
	import { Download, LockOpen, Trash2 } from 'lucide-svelte';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ImagePlus } from 'lucide-svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import { SquareMousePointer } from 'lucide-svelte';
	import CustomAlertDialogue from '$lib/components/CustomAlertDialog.svelte';
	import { toast } from 'svelte-sonner';
	import { User, Users } from 'lucide-svelte';
	import { and, type TriplitClient } from '@triplit/client';
	import { getFeTriplitClient } from '$lib/triplit';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { downloadAsZip, shareImages } from '$lib/gallery';
	import GalleryItem from '$lib/components/GalleryItem.svelte';

	let selectedImages: any = $state([]);
	let selection: any;
	let selectionActive = $state(false);
	let lightbox: PhotoSwipeLightbox | null = $state(null);

	let eventFiles = $state($page.data.eventFiles);
	console.log('isOwner', $page.data.isOwner);

	let isDialogOpen = $state(false);
	let dialogDescription = $state('');
	let onConfirmCallback: (() => void) | null = null;
	let showOnlyCurrentUserUploads = $state(false); // State to track images uploaded by user toggle

	// Function to open the dialog
	function openDialog(description: string, onConfirm: () => void) {
		dialogDescription = description;
		onConfirmCallback = onConfirm;
		isDialogOpen = true;
	}

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
				el.classList.add('border-white');
			});

			lightbox = createPhotoSwipe();
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
			el.classList.add('border-white');
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
			await shareImages(selectedImages);
		} else {
			if (selectedImages.length === 1) {
				// Single image download
				const image = selectedImages[0];
				console.log(image);
				try {
					const response = await fetch(image.src);
					if (!response.ok) {
						alert(`Failed to download image: ${response.statusText}`);
						return;
					}
					const blob = await response.blob();
					const a = document.createElement('a');
					a.href = URL.createObjectURL(blob);
					a.download = image.name || 'image.jpg';
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					console.log(`Downloaded single image: ${image.name}`);
				} catch (error) {
					console.error('Error downloading single image:', error);
					alert('Failed to download the image. Please try again.');
				}
				return;
			}
			// Desktop: Download as ZIP or individually
			await downloadAsZip(selectedImages);
		}
	}

	// TODO: unused?
	function canBulkDelete() {
		if (selectedImages.length === 0) return false;

		const userUploaderId = $page.data.user.id;
		return selectedImages.every((image: any) => image.uploaderId === userUploaderId);
	}

	async function handleDelete(id: string | null = null) {
		// Prepare the file IDs for deletion
		const selectedFileIds = id ? [id] : selectedImages.map((image: any) => image.id);

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

	// handleSelectionChange is called on every selection change to update the selected list of items.
	function handleSelectionChange(elements: Element[] | NodeListOf<Element>, targetArray: any[]) {
		elements.forEach((el) => {
			// Update element styles
			el.classList.remove('border-white');
			el.classList.add('border-blue-400');

			// Extract attributes
			const id = el.getAttribute('data-id');
			const src = el.getAttribute('data-src');
			const name = el.getAttribute('data-name');
			const uploaderId = el.getAttribute('data-uploader-id');

			// Add to the target array if it doesn't already exist
			if (src && name && id && !targetArray.find((item) => item.id === id)) {
				targetArray.push({ src, name, id, uploaderId });
			}
		});
	}

	// TODO: unused?
	function filterByCurrentUserAsUploader() {
		const userUploaderId = $page.data.user.id;

		// Toggle filter state
		showOnlyCurrentUserUploads = !showOnlyCurrentUserUploads;

		const allImages = document.querySelectorAll('.image-item');
		allImages.forEach((image) => {
			const uploaderId = image.getAttribute('data-uploader-id');
			if (showOnlyCurrentUserUploads) {
				// Show only current user's uploads
				if (uploaderId === userUploaderId) {
					image.style.display = 'block'; // Show images uploaded by the user
				} else {
					image.style.display = 'none'; // Hide other images
				}
			} else {
				// Show all images
				image.style.display = 'block';
			}
		});

		// Show toast message
		if (showOnlyCurrentUserUploads) {
			toast.info('Showing only images you uploaded');
		} else {
			toast.info('Showing all images');
		}
	}

	function createPhotoSwipe() {
		lightbox = new PhotoSwipeLightbox({
			gallery: '.gallery-container',
			children: 'a', // Target that tag within the gallery container
			pswpModule: () => import('photoswipe'),
			showHideAnimationType: 'zoom', // Optional animation
			zoom: false,
			close: true
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
							<video controls autoplay class="pswp__img" poster="${imgPoster}">
								<source src="${videoURL}" type="video/mp4" />
								Your browser does not support the video tag.
							</video>
						</div>
					`
				};
			}
		});

		// NOTE: the following is for auto-play, not sure I want it
		// // Ensure video is handled properly on content activation
		// lightbox.on('contentActivate', (e) => {
		// 	const video = e.content.element?.querySelector('video');
		// 	if (video) {
		// 		video.play();
		// 		// Automatically move to the next slide when video ends
		// 		video.onended = () => lightbox.pswp.next();
		// 	}
		// });

		// // Pause video when the content is deactivated
		// lightbox.on('contentDeactivate', (e) => {
		// 	const video = e.content.element?.querySelector('video');
		// 	if (video) {
		// 		video.pause();
		// 		video.onended = null; // Cleanup event listener
		// 	}
		// });

		lightbox.on('uiRegister', function () {
			// Register the Download Button
			lightbox.pswp.ui.registerElement({
				name: 'download-button',
				order: 8,
				isButton: true,
				tagName: 'button',
				html: {
					isCustomSVG: true,
					inner:
						'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
					outlineID: 'pswp__icn-download'
				},
				onClick: (event, el, pswp) => {
					// Set selectedImages to the currently open image
					const currentSlide = pswp.currSlide.data;
					console.log('currentSlide', currentSlide);
					selectedImages = [
						{
							src: currentSlide.src,
							name: currentSlide.alt || 'image.jpg',
							id: currentSlide.id
						}
					];

					// Call handleDownload
					handleDownload();
					selectedImages = [];
				}
			});

			// Register the Delete Button
			lightbox.pswp.ui.registerElement({
				name: 'delete-button',
				order: 9,
				isButton: true,
				tagName: 'button',
				html: {
					isCustomSVG: true,
					inner:
						'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
					outlineID: 'pswp__icn-delete'
				},
				onClick: (event, el, pswp) => {
					const currentSlide = pswp.currSlide.data;

					// Find the corresponding <div> element
					const imageDiv = document.querySelector(`.image-item[data-src="${currentSlide.src}"]`);

					if (!imageDiv) {
						alert('Error: Could not find the corresponding image element.');
						return;
					}

					// Extract attributes for authorization
					const dataId = imageDiv.getAttribute('data-id');
					const dataUploaderId = imageDiv.getAttribute('data-uploader-id');

					// Check if the user is authorized to delete
					if (dataUploaderId === $page.data.user.id || $page.data.isOwner) {
						// Close PhotoSwipe viewer
						pswp.close();

						// Open the dialog
						openDialog(
							'Are you sure you want to delete this image? This action cannot be undone.',
							() => {
								// Perform deletion
								handleDelete(dataId);

								// Remove the image from the DOM
								imageDiv.remove();

								// Optionally close the gallery
								pswp.close();
							}
						);
					} else {
						alert('You are not authorized to delete this image.');
					}
				},
				onInit: (el, pswp) => {
					pswp.on('change', () => {
						const currentSlide = pswp.currSlide.data;

						// Find the corresponding <div> element
						const imageDiv = document.querySelector(`.image-item[data-src="${currentSlide.src}"]`);

						// Hide the button if the user is not authorized
						if (imageDiv) {
							const dataUploaderId = imageDiv.getAttribute('data-uploader-id');
							el.style.display =
								($page.data.user && dataUploaderId === $page.data.user.id) || $page.data.isOwner
									? 'block'
									: 'none';
						} else {
							el.style.display = 'none';
						}
					});
				}
			});
		});

		lightbox.init();
		return lightbox;
	}

	const updateFilesWithLatest = async () => {
		const tempAttendeeId = $page.url.searchParams.get(tempAttendeeIdUrlParam);

		// Fetch updated files using your API endpoint
		try {
			let url = `/bonfire/${$page.params.id}/media/gallery`;
			if (tempAttendeeId) {
				url = url + `?${tempAttendeeIdUrlParam}=${tempAttendeeId}`;
			}
			console.log('fetch images with url', url);
			const response = await fetch(url);
			if (response.ok) {
				const data = await response.json();
				eventFiles = data.files; // Update with the latest data
			} else {
				console.error('Failed to fetch updated files:', await response.json());
			}
		} catch (err) {
			console.error('Error fetching updated files:', err);
		}
	};

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

			handleSelectionChange(changed.added, selectedImages);

			changed.removed.forEach((el) => {
				el.classList.remove('border-blue-400');
				el.classList.add('border-white');
				const id = el.getAttribute('data-id');
				const index = selectedImages.findIndex((img) => img.id === id);
				if (index > -1) selectedImages.splice(index, 1);
			});

			console.log('selectedImages', selectedImages);
		});

		lightbox = createPhotoSwipe();

		let client = getFeTriplitClient($page.data.jwt) as TriplitClient;
		const unsubscribeFromFileQuery = client.subscribe(
			client
				.query('files')
				.where(
					and([
						['event_id', '=', $page.params.id],
						['is_linked_file', '=', false]
					])
				)
				.select(['id'])
				.build(),
			(results, info) => {
				// handle results
				updateFilesWithLatest();
			},
			(error) => {
				// handle error
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					// console.log('server has sent back results for the subscription');
				}
			}
		);

		return () => {
			// Cleanup
			selection.destroy();
			lightbox?.destroy(); // Cleanup when the component is destroyed
			unsubscribeFromFileQuery();
		};
	});
</script>

<div class="mx-4 mb-48 flex flex-col items-center justify-center">
	<!-- Breadcrumbs and Toggle Buttons -->
	<div
		class="sticky top-0 z-10 mt-2 flex flex-col items-center justify-between rounded-xl bg-white bg-opacity-95 px-2 min-[320px]:flex-row sm:w-[550px] md:w-[650px] lg:w-[950px]"
	>
		<Breadcrumb.Root>
			<Breadcrumb.List class="ml-2 text-xs sm:ml-5 sm:text-sm">
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/bonfire/${$page.params.id}`}>Event</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Gallery</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
		<div class="flex py-1 sm:space-x-2">
			<a href="add">
				<Toggle aria-label="toggle bold">
					<ImagePlus class="size-3" /><span class="text-xs sm:text-sm">Upload</span>
				</Toggle>
			</a>
			{#if !$page.data.user}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger
							><Toggle aria-label="toggle selection" onclick={toggleSelection} disabled={true}>
								<SquareMousePointer class="size-3" /> <span class="text-xs sm:text-sm">Select</span>
							</Toggle></Tooltip.Trigger
						>
						<Tooltip.Content class="flex items-center">
							<LockOpen class="mr-1 h-3 w-3" />Login to enable feature
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Toggle aria-label="toggle selection" disabled={true}>
								{#if showOnlyCurrentUserUploads}<Users class="size-3" />{:else}<User
										class="size-3"
									/>{/if}

								<span class="text-xs sm:text-sm">
									{showOnlyCurrentUserUploads ? 'Show All' : 'Show Mine'}
								</span>
							</Toggle>
						</Tooltip.Trigger>
						<Tooltip.Content class="flex items-center">
							<LockOpen class="mr-1 h-3 w-3" /> Login to enable feature
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{:else}
				<Toggle aria-label="toggle selection" onclick={toggleSelection}>
					<SquareMousePointer class="size-3" /> <span class="text-xs sm:text-sm">Select</span>
				</Toggle>
				<!-- Filter Button -->
				<Toggle aria-label="toggle selection" onclick={filterByCurrentUserAsUploader}>
					{#if showOnlyCurrentUserUploads}<Users class="size-3" />{:else}<User
							class="size-3"
						/>{/if}

					<span class="text-xs sm:text-sm">
						{showOnlyCurrentUserUploads ? 'Show All' : 'Show Mine'}
					</span>
				</Toggle>
			{/if}
		</div>
	</div>
	<section class="w-full sm:w-[550px] md:w-[650px] lg:w-[950px]">
		{#if eventFiles.length > 0}
			<div
				class="gallery-container selection-area my-5 grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-5"
			>
				{#each eventFiles as file}
					{#if !file.is_linked_file}
						<div
							class="image-item rounded-xl border-4 border-white"
							data-id={file.id}
							data-uploader-id={file.uploader_id}
							data-src={file.URL}
							data-name={file.file_name}
						>
							<ContextMenu.Root>
								<ContextMenu.Trigger>
									<GalleryItem
										url={file.URL}
										{selectionActive}
										wPixel={file.w_pixel}
										hPixel={file.h_pixel}
										fileName={file.file_name}
										blurhash={file.blurr_hash}
										fileType={file.file_type}
										preview={file.linked_file || null}
									/>
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
					{/if}
				{/each}
			</div>
		{:else}
			<div class="flex h-full w-full justify-center">
				<div
					class="mt-20 flex h-12 w-2/3 items-center justify-center rounded-xl bg-slate-200 text-sm sm:text-base"
				>
					<div>No files yet</div>
				</div>
			</div>
		{/if}
	</section>
</div>

{#if selectionActive}
	<div
		class="fixed bottom-0 left-1/2 flex -translate-x-1/2 transform flex-col items-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-transparent to-transparent"
	>
		<div class="flex items-center space-x-2 p-20">
			<div class="flex flex-col justify-center space-y-1">
				<Button
					disabled={eventFiles.length == selectedImages.length}
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
			{#if $page.data.isOwner || canBulkDelete()}
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

<!-- This alert box is used from JS -->
<CustomAlertDialogue
	bind:isOpen={isDialogOpen}
	{dialogDescription}
	continueCallback={() => {
		if (onConfirmCallback) onConfirmCallback();
		isDialogOpen = false;
	}}
/>

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
