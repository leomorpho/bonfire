<script lang="ts">
	import DashboardPlugin from '@uppy/dashboard';
	import Uppy from '@uppy/core';
	import Webcam from '@uppy/webcam';
	import GoldenRetriever from '@uppy/golden-retriever';
	import Compressor from '@uppy/compressor';
	import ImageEditor from '@uppy/image-editor';
	import Tus from '@uppy/tus';

	// Import CSS for Uppy components and plugins
	import '@uppy/core/dist/style.css';
	import '@uppy/dashboard/dist/style.css';
	import '@uppy/webcam/dist/style.css';
	// import '@uppy/audio/dist/style.min.css';
	import '@uppy/image-editor/dist/style.min.css';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { detectTailwindTheme } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { UploadFileTypes } from '$lib/enums';

	let { imageUrl, unsplashImageDownloadCounterCallback, unsplashAuthorInfo } = $props();

	let uppy: any;

	const maxMbSize = 10;

	onMount(() => {
		const theme = detectTailwindTheme();

		if (uppy) return;

		// Calculate the desired height based on screen height
		const screenHeight = window.innerHeight;
		const calculatedDashboardHeight = Math.min(screenHeight * 0.7, 800); // Use 80% of screen height, but not more than 800px
		const dashboardHeight = calculatedDashboardHeight > 400 ? calculatedDashboardHeight : 400;

		// Initialize Uppy instance with Tus for resumable uploads
		uppy = new Uppy({
			allowMultipleUploads: false,
			debug: false, // Enable debug logs (optional)
			autoProceed: false, // Wait for user action before starting uploads
			restrictions: {
				minNumberOfFiles: 1,
				maxNumberOfFiles: 1,
				maxFileSize: maxMbSize * 1024 * 1024, // Limit file size to 100MB
				allowedFileTypes: ['image/*'] // Allowed file types
			}
		})
			.use(ImageEditor, {
				cropperOptions: {
					initialAspectRatio: 2.5,
					aspectRatio: 2.5,
					viewMode: 2
				},
				actions: {
					revert: true,
					flip: true,
					zoomIn: true,
					zoomOut: true,
					cropSquare: false,
					cropWidescreen: false,
					cropWidescreenVertical: false
				}
			})
			.use(DashboardPlugin, {
				inline: true,
				target: '#uppy-dashboard',
				autoOpen: 'imageEditor', // Automatically open the editor
				showProgressDetails: true,
				proudlyDisplayPoweredByUppy: true,
				note: `Image only. Max size: ${maxMbSize}MB.`,
				theme: theme as 'light' | 'auto' | 'dark' | undefined,
				height: `${dashboardHeight}px`
			})

			.use(Webcam, {
				mirror: true // Use mirror mode for webcam
				// countdown: true // Add a countdown before capturing
			})
			.use(GoldenRetriever)

			.use(Compressor)
			.use(Tus, {
				endpoint: `/api/tus/files?eventId=${$page.params.id}`, // Remove trailing slashes
				removeFingerprintOnSuccess: true, // 🔹 Remove tracking ID after success
				chunkSize: 1 * 1024 * 1024, // 1MB chunk size
				retryDelays: [0, 3000, 5000, 10000], // Retry logic
				// 🔹 Prevent auto-resume
				onShouldRetry: (err, retryAttempt, options) => {
					console.log('⚠️ Upload error, clearing old sessions:', err);
					uppy.getFiles().forEach((file) => {
						uppy.removeFile(file.id);
					});
					return false; // 🚀 Stop retries for failed uploads
				}
			})

			.on('upload-retry', (file) => {
				console.warn(`🔄 Retrying upload: ${file.name}`);
			})
			.on('upload-success', (file, response) => {
				console.log('Upload successful:', file, response);
				toast.success(
					'Upload successful! Your banner is being optimized and will appear shortly in the app.',
					{
						duration: 10000 // 10 seconds
					}
				);
				goto(`/bonfire/${$page.params.id}`);
			})
			.on('upload-error', (file, error) => {
				console.error(`❌ Upload failed for banner`, error);
				toast.error(
					'❌ Upload failed. Please try again later or contact support if the issue persists.',
					{
						duration: 6000 // 6 seconds
					}
				);
			})
			.on('error', (error) => {
				console.error(`❌ Upload failed for banner`, error);
				toast.error(
					'❌ Upload failed. Please try again later or contact support if the issue persists.',
					{
						duration: 6000 // 6 seconds
					}
				);
			})
			.on('file-added', (file) => {
				console.log('📄 File added:', file.name);

				try {
					let fileMeta = {
						originalName: file.name,
						mimeType: file.type,
						size: file.size,
						uploadStartTime: new Date().toISOString(),
						userId: $page.data.user?.id,
						eventId: typeof $page.params.id !== 'undefined' ? $page.params.id : '',
						uploadFileType: UploadFileTypes.BONFIRE_COVER_PHOTO,
						unsplashImageDownloadCounterCallback: unsplashImageDownloadCounterCallback
					};

					if (unsplashAuthorInfo?.name && unsplashAuthorInfo?.username) {
						fileMeta.unsplashAuthorName = unsplashAuthorInfo?.name;
						fileMeta.unsplashUsername = unsplashAuthorInfo?.username;
					}
					uppy.setFileMeta(file.id, fileMeta);
				} catch (error) {
					console.error('Error setting file meta:', error);
				}
			});
	});

	$effect(() => {
		// Add the image from the URL to Uppy
		if (imageUrl) {
			const getImage = async () => {
				uppy.clear();
				const response = await fetch(imageUrl);
				const blob = await response.blob();
				const mimeType = blob.type || 'image/jpeg'; // Default to 'image/jpeg' if type is undefined
				uppy.addFile({
					source: imageUrl,
					name: 'image.jpg', // You can set a default name or extract it from the URL
					type: mimeType, // Set the appropriate MIME type
					data: blob
				});
			};
			getImage();
		}
	});
</script>

<div id="uppy-dashboard" class="mb-5"></div>

<style>
	#uppy-dashboard {
		overflow: hidden; /* Ensure content doesn't overflow */
	}
</style>
