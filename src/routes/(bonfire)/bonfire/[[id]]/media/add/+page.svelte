<script lang="ts">
	// import { Dashboard } from '@uppy/svelte';
	import Uppy from '@uppy/core';
	import Webcam from '@uppy/webcam';
	// import Audio from '@uppy/audio';
	import XHR from '@uppy/xhr-upload';
	import GoldenRetriever from '@uppy/golden-retriever';
	import Compressor from '@uppy/compressor';
	import DashboardPlugin from '@uppy/dashboard';

	// Import CSS for Uppy components and plugins
	import '@uppy/core/dist/style.css';
	import '@uppy/dashboard/dist/style.css';
	import '@uppy/webcam/dist/style.css';
	import '@uppy/audio/dist/style.min.css';

	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { tempAttendeeSecretParam } from '$lib/enums';

	let uppy;
	let totalFiles = 0; // To track total files to upload
	let uploadedFiles = 0; // To track successfully uploaded files

	const maxMbSize = 100;

	onMount(() => {
		let imageUploadEndpoint = `/bonfire/${$page.params.id}/media/add`;
		let onSuccessEndpoint = `/bonfire/${$page.params.id}/media/gallery`;

		const tempAttendeeSecret = $page.url.searchParams.get(tempAttendeeSecretParam);
		if (tempAttendeeSecret) {
			imageUploadEndpoint = imageUploadEndpoint + `?${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
			onSuccessEndpoint = onSuccessEndpoint + `?${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
		}

		// Initialize Uppy instance with Tus for resumable uploads
		uppy = new Uppy({
			debug: false, // Enable debug logs (optional)
			autoProceed: false, // Wait for user action before starting uploads
			restrictions: {
				maxFileSize: maxMbSize * 1024 * 1024, // Limit file size to 100MB
				// allowedFileTypes: ['image/*', 'video/*', 'audio/*'] // Allowed file types
				allowedFileTypes: ['image/*', 'video/*'] // Allowed file types
			}
		})
			.use(DashboardPlugin, {
				inline: true,
				target: '#uppy-dashboard',
				autoOpen: 'imageEditor', // Automatically open the editor
				showProgressDetails: true,
				note: `Images or videos. Max size: ${maxMbSize}MB.`
			})
			.use(Webcam, {
				mirror: true // Use mirror mode for webcam
				// countdown: true // Add a countdown before capturing
			})
			// .use(Audio)
			.use(GoldenRetriever)
			.use(Compressor)
			.use(XHR, {
				endpoint: imageUploadEndpoint, // Your SvelteKit endpoint
				method: 'POST',
				formData: true,
				fieldName: 'file', // Ensure this matches the backend expectation
				headers: {
					Authorization: `Bearer ${window.localStorage.getItem('token')}`
				},
				allowedMetaFields: true
			})
			.on('upload-start', (file) => {
				totalFiles = uppy.getFiles().length; // Count the total number of files in the queue
				uploadedFiles = 0; // Reset the counter on upload start
			})
			.on('upload-success', (file, response) => {
				uploadedFiles++; // Increment on successful upload
				console.log('Upload successful:', file, response);

				// Redirect after all files have been uploaded
				if (uploadedFiles === totalFiles) {
					goto(onSuccessEndpoint);
				}
			})
			.on('error', (error) => {
				console.error('Upload error:', error);
			});

		uppy.on('file-added', (file) => {
			uppy.setFileMeta(file.id, {
				originalName: file.name,
				mimeType: file.type,
				size: file.size
			});
		});
	});
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<Breadcrumb.Root class="mb-10 mt-2 rounded-xl bg-white bg-opacity-95 p-2">
			<Breadcrumb.List class="ml-2 text-xs sm:ml-5 sm:text-sm">
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/bonfire/${$page.params.id}`}>Event</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href={`/bonfire/${$page.params.id}/media/gallery`}
						>Gallery</Breadcrumb.Link
					>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Upload</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
		<div id="uppy-dashboard"></div>
	</section>
</div>
