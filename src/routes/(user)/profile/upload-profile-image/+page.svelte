<script lang="ts">
	import DashboardPlugin from '@uppy/dashboard';

	import Uppy from '@uppy/core';
	import Webcam from '@uppy/webcam';
	import XHR from '@uppy/xhr-upload';
	import GoldenRetriever from '@uppy/golden-retriever';
	import Compressor from '@uppy/compressor';
	import ImageEditor from '@uppy/image-editor';

	// Import CSS for Uppy components and plugins
	import '@uppy/core/dist/style.css';
	import '@uppy/dashboard/dist/style.css';
	import '@uppy/webcam/dist/style.css';
	// import '@uppy/audio/dist/style.min.css';
	import '@uppy/image-editor/dist/style.min.css';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { detectTailwindTheme } from '$lib/utils';

	let uppy;

	const maxMbSize = 5;

	onMount(() => {
		const theme = detectTailwindTheme();

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
			.use(DashboardPlugin, {
				inline: true,
				target: '#uppy-dashboard',
				autoOpen: 'imageEditor', // Automatically open the editor
				showProgressDetails: true,
				note: `Image only. Max size: ${maxMbSize}MB.`,
				theme: theme
			})
			.use(Webcam, {
				mirror: true // Use mirror mode for webcam
				// countdown: true // Add a countdown before capturing
			})
			.use(GoldenRetriever)
			.use(ImageEditor, {
				cropperOptions: {
					initialAspectRatio: 1,
					aspectRatio: 1
				},
				actions: {
					revert: true,
					rotate: true,
					granularRotate: true,
					flip: true,
					zoomIn: true,
					zoomOut: true,
					cropSquare: false,
					cropWidescreen: false,
					cropWidescreenVertical: false
				}
			})
			.use(Compressor)
			.use(XHR, {
				endpoint: '/profile/upload-profile-image', // Your SvelteKit endpoint
				method: 'POST',
				formData: true,
				fieldName: 'file', // Ensure this matches the backend expectation
				headers: {
					Authorization: `Bearer ${window.localStorage.getItem('token')}`
				}
			})
			.on('upload-success', (file, response) => {
				console.log('Upload successful:', file, response);
				goto('/profile');
			})
			.on('error', (error) => {
				console.error('Upload error:', error);
			});
	});
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="my-6 flex justify-center text-2xl font-semibold">Edit Avatar</h2>

		<div id="uppy-dashboard"></div>
	</section>
</div>
