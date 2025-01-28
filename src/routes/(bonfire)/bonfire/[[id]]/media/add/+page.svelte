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
	import type { TriplitClient } from '@triplit/client';
	import { getFeTriplitClient } from '$lib/triplit';

	let uppy: any;
	let totalFiles = 0; // To track total files to upload
	let uploadedFiles = 0; // To track successfully uploaded files

	let client: TriplitClient;

	const maxMbSize = 100;

	let presignEndpoint = `/bonfire/${$page.params.id}/media/presign`;
	let onSuccessEndpoint = `/bonfire/${$page.params.id}/media/gallery`;

	const tempAttendeeSecret = $page.url.searchParams.get(tempAttendeeSecretParam);
	if (tempAttendeeSecret) {
		presignEndpoint = presignEndpoint + `?${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
		onSuccessEndpoint = onSuccessEndpoint + `?${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
	}

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		// Initialize Uppy instance with Tus for resumable uploads
		uppy = new Uppy({
			debug: false, // Enable debug logs (optional)
			autoProceed: false, // Wait for user action before starting uploads
			restrictions: {
				maxFileSize: maxMbSize * 1024 * 1024, // Limit file size to 100MB
				// allowedFileTypes: ['image/*', 'video/*', 'audio/*'] // Allowed file types
				allowedFileTypes: ['image/*'] // Allowed file types
			}
		})
			.use(DashboardPlugin, {
				inline: true,
				target: '#uppy-dashboard',
				autoOpen: 'imageEditor', // Automatically open the editor
				showProgressDetails: true,
				note: `Images, videos or sound files. Max size: ${maxMbSize}MB.`
			})
			.use(Webcam, {
				mirror: true // Use mirror mode for webcam
				// countdown: true // Add a countdown before capturing
			})
			// .use(Audio)
			.use(GoldenRetriever)
			.use(Compressor)
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

		// Handle file upload on clicking Uppy upload button
		uppy.on('upload', async () => {
			const files = uppy.getFiles();
			for (const file of files) {
				try {
					// Step 1: Fetch presigned URL
					const presignResponse = await fetch(presignEndpoint, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${window.localStorage.getItem('token')}`
						},
						body: JSON.stringify({
							filename: file.name,
							contentType: file.type,
							size: file.size
						})
					});

					if (!presignResponse.ok) throw new Error('Failed to fetch presigned URL');

					const { uploadURL, fileKey, existingTempAttendeeId } = await presignResponse.json();

					// Step 2: Upload to S3
					const s3Response = await fetch(uploadURL, {
						method: 'PUT',
						headers: { 'Content-Type': file.type },
						body: file.data
					});

					if (!s3Response.ok) throw new Error('Failed to upload to S3');

					// Step 3: Create `files` entry in Triplit
					await client.insert('files', {
						event_id: $page.params.id,
						file_key: fileKey,
						file_type: file.type,
						file_name: file.name,
						size_in_bytes: file.size,
						uploader_id: $page.data.user?$page.data.user.id : existingTempAttendeeId,
						uploaded_at: new Date().toISOString()
					});

					// Mark file as uploaded in Uppy
					uppy.emit('upload-success', file, { uploadURL });

					// Send notification
				} catch (error) {
					console.error('Error uploading file:', error);
					uppy.emit('upload-error', file, error);
				}
			}

			// Redirect after all uploads are complete
			goto(onSuccessEndpoint);
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
