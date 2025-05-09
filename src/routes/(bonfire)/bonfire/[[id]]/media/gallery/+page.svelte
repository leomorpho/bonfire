<script lang="ts">
	import { tempAttendeeSecretParam } from '$lib/enums';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import SelectionArea from '@viselect/vanilla';
	import { Download, Trash2 } from 'lucide-svelte';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ImagePlus, ImageDown } from 'lucide-svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import CustomAlertDialogue from '$lib/components/CustomAlertDialog.svelte';
	import { toast } from 'svelte-sonner';
	import { User, Users } from 'lucide-svelte';
	import { and, type TriplitClient } from '@triplit/client';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { downloadAsZip, shareImages } from '$lib/gallery';
	import GalleryItem from '$lib/components/GalleryItem.svelte';
	import LoaderPage from '$lib/components/LoaderPage.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import FadeIn from '$lib/components/containers/FadeIn.svelte';
	import BonfireNoInfoCard from '$lib/components/BonfireNoInfoCard.svelte';

	let selectedImages: any = $state([]);
	let selection: any;
	let selectionActive = $state(false);
	let isLightboxInitialized = $state(false);
	let lightbox: PhotoSwipeLightbox | null = $state(null);
	let showPageActionLoading = $state(false);
	let showPageActionLoadingText = $state('Loading...');
	let isDeleteFileConfirmationDialogOpen = $state(false);
	let eventFiles = $state($page.data.eventFiles);
	console.log('isOwner', $page.data.isAdmin);
	const tempAttendeeId = $page.url.searchParams.get(tempAttendeeSecretParam);

	let isDialogOpen = $state(false);
	let dialogDescription = $state('');
	let onConfirmCallback: (() => void) | null = null;
	let showOnlyCurrentUserUploads = $state(false); // State to track images uploaded by user toggle

	let currUserId = $state('');
	let eventOwnerUserId = $state('');
	let adminUserIds: Set<string> = $state(new Set<string>());
	let isCurrenUserEventAdmin = $state(false);

	let deleteButtonEnabled = $state(true);
	let downloadButtonEnabled = $state(true);

	$effect(() => {
		if (eventOwnerUserId == currUserId) {
			isCurrenUserEventAdmin = true;
		}
	});

	$effect(() => {
		if ($page.data.isAdmin || adminUserIds.has(currUserId)) {
			isCurrenUserEventAdmin = true;
		}
	});

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
		console.log('selectionActive', selectionActive);
		if (selectionActive) {
			lightbox?.destroy();
			// NOTE: we don't have specific styling for non-selected state
			// const items = document.querySelectorAll('.image-item');
			// items.forEach((el) => {
			// });
		} else {
			// Clear selectedImages and remove selection styling
			selectedImages = [];
			const selectedElements = document.querySelectorAll('.image-item');
			// Selected items will have a white border, which needs to be removed when turning off selection
			selectedElements.forEach((el) => {
				el.classList.remove('border-blue-300');
				el.classList.add('border-transparent');
			});

			lightbox = createPhotoSwipe();

			downloadButtonEnabled = true;
			deleteButtonEnabled = true;
		}
	}

	function selectAll() {
		const allImages = document.querySelectorAll('.image-item');
		toggleSelectionStateForItem(allImages, selectedImages);

		console.log('All images selected:', selectedImages);
	}

	function selectNone() {
		const selectedElements = document.querySelectorAll('.image-item');
		selectedElements.forEach((el) => {
			// el.classList.remove('rounded-lg');
			el.classList.remove('border-blue-300');
			el.classList.add('border-transparent');
		});
		selectedImages = [];
		console.log('Selection cleared');
	}

	// handleSelectionChange is called on every selection change to update the selected list of items.
	function toggleSelectionStateForItem(
		elements: Element[] | NodeListOf<Element>,
		targetArray: any[]
	) {
		elements.forEach((el) => {
			// Update element styles
			el.classList.remove('border-transparent');
			el.classList.add('border-blue-300');

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

	// Function to handle download
	async function handleDownload() {
		try {
			showPageActionLoading = true;
			showPageActionLoadingText = `Downloading ${selectedImages.length} files...`;

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
		} catch (e) {
			console.log('failed to handle file download', e);
			alert('Failed to download the image. Please try again.');
		} finally {
			showPageActionLoading = false;
		}
	}

	// TODO: unused?
	function canBulkDelete() {
		if (selectedImages.length === 0) return false;

		const userUploaderId = $page.data.user.id;
		return selectedImages.every((image: any) => image.uploaderId === userUploaderId);
	}

	async function handleDelete(
		id: string | null = null,
		imageDiv: any | null = null,
		pswp: any | null = null
	) {
		isDeleteFileConfirmationDialogOpen = false;

		let filesSuccessfullyDeleted = false;
		try {
			showPageActionLoading = true;
			showPageActionLoadingText = `Deleting ${selectedImages.length} files...`;

			// Prepare the file IDs for deletion
			const selectedFileIds = id ? [id] : selectedImages.map((image: any) => image.id);

			if (!selectedFileIds || selectedFileIds.length === 0) {
				alert('No files selected for deletion.');
				return;
			}

			const response = await fetch('delete' + `?${tempAttendeeSecretParam}=${tempAttendeeId}`, {
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

				if (imageDiv) {
					// Remove the image from the DOM
					imageDiv.remove();
				}
				if (pswp) {
					// Optionally close the gallery
					pswp.close();
				}
			} else {
				toast.error('Failed to delete files, try again later');
				console.error('Failed to delete files:', await response.text());
			}
		} catch (e) {
			console.log('failed to delete files', e);
		} finally {
			showPageActionLoading = false;
		}
		return filesSuccessfullyDeleted;
	}

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
			close: true,
			initialZoomLevel: 'fit',
			secondaryZoomLevel: 'fit',
			imageClickAction: false,
			bgClickAction: 'close' // Close gallery when tapping the background
		});

		// Use afterInit to ensure the lightbox is fully initialized
		lightbox.on('afterInit', () => {
			// Adjust the cursor after the lightbox is fully initialized
			const pswpElement = document.querySelector('.pswp');
			if (pswpElement) {
				pswpElement.style.cursor = 'pointer'; // Set cursor to pointer after the lightbox is initialized
			}

			// Also ensure that all `.pswp__img` and `.pswp__viewport` elements have the correct cursor
			const imgElements = document.querySelectorAll('.pswp__img, .pswp__viewport');
			imgElements.forEach((el) => {
				el.style.cursor = 'pointer'; // Set cursor to pointer for the image and viewport
			});
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
						'<svg class="download-button" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
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
						'<svg class="delete-button" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
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
					if (
						dataUploaderId == tempAttendeeId ||
						($page.data.user && dataUploaderId === $page.data.user.id) ||
						isCurrenUserEventAdmin
					) {
						// Close PhotoSwipe viewer
						pswp.close();

						// Open the dialog
						openDialog(
							'Are you sure you want to delete this image? This action cannot be undone.',
							() => {
								try {
									// Perform deletion
									handleDelete(dataId, imageDiv, pswp);
								} catch (e) {
									console.log('failed to delete image', e);
								}
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
								($page.data.user && dataUploaderId === $page.data.user.id) || isCurrenUserEventAdmin
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
		isLightboxInitialized = true;

		return lightbox;
	}

	const updateFilesWithLatest = async () => {
		console.log('updateFilesWithLatest called');
		const tempAttendeeId = $page.url.searchParams.get(tempAttendeeSecretParam);

		// Fetch updated files using your API endpoint
		try {
			let url = `/bonfire/${$page.params.id}/media/gallery`;
			if (tempAttendeeId) {
				url = url + `?${tempAttendeeSecretParam}=${tempAttendeeId}`;
			}
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
			startAreas: ['.gallery-container'], // Start selection only within this container
			behaviour: {
				overlap: 'invert',
				intersect: 'touch',
				startThreshold: { x: 10, y: 10 }
			},
			features: { singleTap: { allow: true, intersect: 'touch' } }
		}).on('move', ({ store: { changed } }) => {
			if (!selectionActive) return;
			console.log('Added:', changed.added);
			console.log('Removed:', changed.removed);

			toggleSelectionStateForItem(changed.added, selectedImages);

			changed.removed.forEach((el) => {
				el.classList.remove('border-blue-300');
				el.classList.add('border-transparent');
				const id = el.getAttribute('data-id');
				const index = selectedImages.findIndex((img) => img.id === id);
				if (index > -1) selectedImages.splice(index, 1);
			});

			console.log('selectedImages', selectedImages);
		});

		lightbox = createPhotoSwipe();

		let client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromFileQuery = client.subscribe(
			client
				.query('files')
				.Where(
					and([
						['event_id', '=', $page.params.id],
						['is_linked_file', '=', false]
					])
				)
				.Select(['id']),
			(results) => {
				// console.log('A NEW FILE IS AVAILABLE');
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

		const unsubscribeFromEventQuery = client.subscribe(
			client
				.query('events')
				.Where([['id', '=', $page.params.id]])
				.Select(['user_id']),

			(results) => {
				if (results.length == 1) {
					eventOwnerUserId = results[0].user_id;
				}
			},
			(error) => {
				console.error('Error fetching event:', error);
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		const unsubscribeFromEventAdminsQUery = client.subscribe(
			client
				.query('event_admins')
				.Where(and([['event_id', '=', $page.params.id]]))
				.Select(['user_id']),
			(results, info) => {
				adminUserIds = new Set(results.map((admin: { user_id: string }) => admin.user_id));
				console.log('adminUserIds', adminUserIds);
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
			unsubscribeFromEventQuery();
			unsubscribeFromEventAdminsQUery();
		};
	});
</script>

<FadeIn>
	<div class="mx-4 mb-48 flex flex-col items-center justify-center">
		<!-- Breadcrumbs and Toggle Buttons -->
		<div
			class="sticky top-0 z-10 mt-2 flex flex-col items-center justify-between rounded-xl bg-white bg-opacity-95 px-2 dark:bg-slate-900 min-[320px]:flex-row sm:w-[550px] md:w-[650px] lg:w-[950px]"
		>
			<BackButton url={`/bonfire/${$page.params.id}`} />

			<div class="ml-4 flex items-center py-1 sm:space-x-2">
				<a href="add">
					<Toggle id="upload-new-images" aria-label="toggle bold">
						<ImagePlus class="!h-5 !w-5 sm:!h-4 sm:!w-4" /><span
							class="hidden text-xs sm:block sm:text-sm">Upload</span
						>
					</Toggle>
				</a>

				{#if $page.data.user}
					<Toggle
						id="delete-images"
						aria-label="toggle bold"
						onclick={() => {
							downloadButtonEnabled = false;
							toggleSelection();
						}}
						class="data-[state=on]:bg-slate-300"
						disabled={!deleteButtonEnabled}
					>
						<Trash2 class="!h-5 !w-5 sm:!h-4 sm:!w-4" /><span
							class="hidden text-xs sm:block sm:text-sm">Delete</span
						>
					</Toggle>
					<Toggle
						aria-label="toggle selection"
						onclick={() => {
							deleteButtonEnabled = false;
							toggleSelection();
						}}
						id="toggle-select-images"
						class="data-[state=on]:bg-slate-300"
						disabled={!downloadButtonEnabled}
					>
						<ImageDown class="!h-5 !w-5 sm:!h-4 sm:!w-4" />
						<span class="hidden text-xs sm:block sm:text-sm">Download</span>
					</Toggle>
					<!-- Filter Button -->
					<Toggle
						aria-label="toggle selection"
						onclick={filterByCurrentUserAsUploader}
						id="toggle-show-user-uploaded-images"
						class="data-[state=on]:bg-slate-300"
					>
						{#if showOnlyCurrentUserUploads}
							<Users class="!h-5 !w-5 sm:!h-4 sm:!w-4" />
						{:else}
							<User class="!h-5 !w-5 sm:!h-4 sm:!w-4" />
						{/if}

						<span class="hidden text-xs sm:block sm:text-sm">
							{showOnlyCurrentUserUploads ? 'Show All' : 'Show Mine'}
						</span>
					</Toggle>
				{/if}
			</div>
			<div></div>
		</div>
		<section class="w-full sm:w-[550px] md:w-[650px] lg:w-[950px]">
			{#if eventFiles.length > 0}
				<div
					class="gallery-container selection-area my-5 grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-5"
				>
					{#each eventFiles as file}
						{#if !file.is_linked_file}
							<div
								class="image-item rounded-xl border-4 border-transparent"
								data-id={file.id}
								data-uploader-id={file.uploader_id}
								data-src={file.URL}
								data-name={file.file_name}
							>
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<GalleryItem
											url={file.URL}
											urlActive={!selectionActive && isLightboxInitialized}
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
										{#if $page.data.user.id == file.uploader_id || isCurrenUserEventAdmin}
											<CustomAlertDialogue
												continueCallback={() => handleDelete(file.id)}
												dialogDescription={`This action cannot be undone. This will permanently delete ${selectedImages.length} this file from our servers.`}
											>
												<ContextMenu.Item>Delete this file</ContextMenu.Item></CustomAlertDialogue
											>
										{/if}
										{#if isCurrenUserEventAdmin && selectedImages.length > 1}
											<CustomAlertDialogue
												continueCallback={() => handleDelete()}
												dialogDescription={`This action cannot be undone. This will permanently delete ${selectedImages.length} this file from our servers.`}
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
				<div class="flex h-[60vh] w-full items-center justify-center">
					<BonfireNoInfoCard text={'No files yet'} />
				</div>
			{/if}
		</section>
	</div>

	{#if selectionActive}
		<div
			class="fixed bottom-0 left-1/2 flex -translate-x-1/2 transform flex-col items-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-transparent to-transparent"
		>
			<div class="p-20">
				{#if selectedImages.length > 0}
					<div class="flex w-full justify-center py-2">{selectedImages.length} files selected</div>
				{/if}
				<div class="flex items-center space-x-2">
					<div class="flex flex-col justify-center space-y-1">
						<Button
							disabled={eventFiles.length == selectedImages.length}
							onclick={selectAll}
							class="p-1 text-xs dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 sm:p-4 sm:text-lg lg:p-6 lg:text-2xl"
							>Select All</Button
						>
						<Button
							disabled={selectedImages.length == 0}
							onclick={selectNone}
							class="p-1 text-xs dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 sm:p-4 sm:text-lg lg:p-6 lg:text-2xl"
							>Select None</Button
						>
					</div>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<button
									id="download-selected-files"
									disabled={selectedImages.length == 0}
									onclick={handleDownload}
									class="rounded-full p-4 text-white shadow-lg transition
							{selectedImages.length === 0 ? 'cursor-not-allowed bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'}"
								>
									<!-- Button Icon -->
									<Download class="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12" />
								</button></Tooltip.Trigger
							>
							<Tooltip.Content>
								<p>Download</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
					{#if isCurrenUserEventAdmin || canBulkDelete()}
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<CustomAlertDialogue
										bind:isOpen={isDeleteFileConfirmationDialogOpen}
										continueCallback={() => handleDelete()}
										disabled={selectedImages.length == 0}
										dialogDescription={`This action cannot be undone. This will permanently delete ${selectedImages.length} ${selectedImages.length > 1 ? 'files' : 'file'} from our servers.`}
									>
										<button
											id="delete-selected-files"
											disabled={selectedImages.length == 0}
											class="rounded-full p-4 text-white shadow-lg transition
							{selectedImages.length === 0 ? 'cursor-not-allowed bg-red-100' : 'bg-red-500 hover:bg-red-600'}"
										>
											<!-- Button Icon -->
											<Trash2 class="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12" />
										</button>
									</CustomAlertDialogue>
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

	<LoaderPage show={showPageActionLoading} text={showPageActionLoadingText} />
</FadeIn>

<style>
	.selection-area {
		border-radius: 0.1em;
	}
	.gallery-container {
		user-select: none;
	}
	/* Disable zoom cursor for PhotoSwipe lightbox */
	.pswp__img,
	.pswp__zoom-wrap,
	.pswp__viewport {
		cursor: pointer !important; /* Ensure regular pointer cursor */
	}
	/* Ensure the PhotoSwipe buttons are visible on iOS */
	.pswp__top-bar {
		padding-top: env(safe-area-inset-top) !important;
	}
</style>
