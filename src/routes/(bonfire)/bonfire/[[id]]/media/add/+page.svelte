<script lang="ts">
	// import { Dashboard } from '@uppy/svelte';
	import Uppy from '@uppy/core';
	import Webcam from '@uppy/webcam';
	// import Audio from '@uppy/audio';
	import GoldenRetriever from '@uppy/golden-retriever';
	import Compressor from '@uppy/compressor';
	import DashboardPlugin from '@uppy/dashboard';

	// Import CSS for Uppy components and plugins
	import '@uppy/core/dist/style.css';
	import '@uppy/dashboard/dist/style.css';
	import '@uppy/webcam/dist/style.css';
	// import '@uppy/audio/dist/style.min.css';

	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { tempAttendeeSecretParam } from '$lib/enums';
	import Tus from '@uppy/tus';
	import { toast } from 'svelte-sonner';
	import { detectTailwindTheme } from '$lib/utils';
	import BackButton from '$lib/components/BackButton.svelte';

	let uppy: any;

	let totalFiles = 0; // To track total files to upload
	let uploadedFiles = 0; // To track successfully uploaded files
	let currentProgress = {};

	const maxMbSize = 100;

	let theme = 'light';
	let observer: any;

	onMount(() => {
		theme = detectTailwindTheme();

		// Watch for Tailwind dark mode changes
		observer = new MutationObserver(() => {
			theme = detectTailwindTheme();
		});

		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		let onSuccessEndpoint = `/bonfire/${$page.params.id}/media/gallery`;

		const tempAttendeeSecret = $page.url.searchParams.get(tempAttendeeSecretParam);
		if (tempAttendeeSecret) {
			onSuccessEndpoint = onSuccessEndpoint + `?${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
		}

		// Initialize Uppy instance with Tus for resumable uploads
		uppy = new Uppy({
			debug: true, // Enable debug logs (optional)
			autoProceed: false, // Wait for user action before starting uploads
			allowMultipleUploads: false, // Ensure only one upload at a time
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
				// proudlyDisplayPoweredByUppy: false,
				note: `Images or videos. Max size: ${maxMbSize}MB.`,
				metaFields: [{ id: 'name', name: 'Name', placeholder: 'File name' }],
				theme: theme
			})
			.use(Webcam, {
				mirror: true // Use mirror mode for webcam
			})
			// .use(Audio)
			.use(GoldenRetriever)
			.use(Compressor)
			.use(Tus, {
				endpoint: `/api/tus/files?eventId=${$page.params.id}&${tempAttendeeSecretParam}=${tempAttendeeSecret}`, // Remove trailing slashes
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
				},
				// Inject tempAttendeeSecretParam into EVERY request
				onBeforeRequest: (req) => {
					if (tempAttendeeSecret) {
						req.setHeader('X-Temp-Attendee-Secret', tempAttendeeSecret);
					}
				}
			});

		uppy.on('upload-start', (file) => {
			totalFiles = uppy.getFiles().length; // Count the total number of files in the queue
			uploadedFiles = 0; // Reset the counter on upload start
			currentProgress = {};
		});

		uppy.on('upload-progress', (file, progress) => {
			console.log(`📊 Progress - ${file.name}: ${progress.bytesUploaded} / ${progress.bytesTotal}`);
		});

		uppy.on('upload-error', (file, error) => {
			console.error(`❌ Upload failed for ${file.name}:`, error);
			toast.error(
				'❌ Upload failed. Please try again later or contact support if the issue persists.',
				{
					duration: 6000 // 6 seconds
				}
			);
		});

		uppy.on('upload-retry', (file) => {
			console.warn(`🔄 Retrying upload: ${file.name}`);
		});

		uppy.on('upload-success', (file, response) => {
			uploadedFiles++; // Increment on successful upload
			console.log(`Successfully uploaded: ${file.name}`, response);

			// Redirect after all files have been uploaded
			if (uploadedFiles === totalFiles) {
				toast.success(
					'Upload successful! Your files are being optimized and will appear in the gallery shortly.',
					{
						duration: 10000 // 10 seconds
					}
				);

				goto(onSuccessEndpoint);
			}
		});

		uppy.on('error', (error) => {
			console.error('Upload error:', error);
		});

		uppy.on('file-added', (file) => {
			console.log('📄 File added:', file.name);

			uppy.setFileMeta(file.id, {
				originalName: file.name,
				mimeType: file.type,
				size: file.size,
				uploadStartTime: new Date().toISOString(),
				eventId: typeof $page.params.id !== 'undefined' ? $page.params.id : '',
				userId: $page.data.user?.id,
				tempAttendeeSecret: tempAttendeeSecret
			});
		});

		// Track individual file progress
		uppy.on('upload-progress', (file, progress) => {
			const { bytesUploaded, bytesTotal } = progress;
			const fileProgress = Math.floor((bytesUploaded / bytesTotal) * 100);

			currentProgress[file.id] = {
				bytesUploaded,
				bytesTotal,
				percentage: fileProgress
			};

			// Update the UI with detailed progress
			const progressDetails = document.querySelector(
				`[data-uppy-file-id="${file.id}"] .uppy-Dashboard-Item-statusSize`
			);
			if (progressDetails) {
				const uploadedMB = (bytesUploaded / (1024 * 1024)).toFixed(1);
				const totalMB = (bytesTotal / (1024 * 1024)).toFixed(1);
				progressDetails.textContent = `${uploadedMB}MB of ${totalMB}MB (${fileProgress}%)`;
			}
		});
	});

	// Ensure the observer stops when the module is unloaded
	onDestroy(() => {
		if (observer) observer.disconnect();
	});
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2
			class="mb-5 flex w-full items-center justify-between rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900"
		>
			<BackButton url={`/bonfire/${$page.params.id}/media/gallery`} />
			<div>Upload new media</div>
			<div></div>
		</h2>
		<div id="uppy-dashboard"></div>
	</section>
</div>
