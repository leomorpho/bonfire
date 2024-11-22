<script lang="ts">
	import { Dashboard } from '@uppy/svelte';
	import Uppy from '@uppy/core';
	import Webcam from '@uppy/webcam';
	import Audio from '@uppy/audio';
	import XHR from '@uppy/xhr-upload';

	// Import CSS for Uppy components and plugins
	import '@uppy/core/dist/style.css';
	import '@uppy/dashboard/dist/style.css';
	import '@uppy/webcam/dist/style.css';
	import '@uppy/audio/dist/style.min.css';

	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';

	let uppy;

	onMount(() => {
		// Initialize Uppy instance with Tus for resumable uploads
		uppy = new Uppy({
			debug: true, // Enable debug logs (optional)
			autoProceed: false, // Wait for user action before starting uploads
			restrictions: {
				maxFileSize: 100 * 1024 * 1024, // Limit file size to 100MB
				allowedFileTypes: ['image/*', 'video/*', 'audio/*'] // Allowed file types
			}
		})
			.use(Webcam, {
				mirror: true, // Use mirror mode for webcam
				countdown: true // Add a countdown before capturing
			})
			.use(Audio)
			.use(XHR, {
				endpoint: `/bonfire/${$page.params.id}/media/add`, // Your SvelteKit endpoint
				method: 'POST',
				formData: true,
				fieldName: 'file', // Ensure this matches the backend expectation
				headers: {
					Authorization: `Bearer ${window.localStorage.getItem('token')}`
				}
			})
			.on('upload-success', (file, response) => {
				console.log('Upload successful:', file, response);
			})
			.on('error', (error) => {
				console.error('Upload error:', error);
			});
	});
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		{#if uppy}
			<!-- Display Uppy Dashboard -->
			<Dashboard
				{uppy}
				inline={true}
				showProgressDetails={true}
				note="Images, videos, and audio only. Max size: 100MB."
			/>
		{/if}
	</section>
</div>
