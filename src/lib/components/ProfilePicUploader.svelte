<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	// Props using $props rune
	let {
		allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
		maxSizeMB = 5,
		defaultShape = 'round' as 'round' | 'square'
	} = $props();

	// State using let rune
	let fileInput: HTMLInputElement;
	let previewUrl = $state<string | null>(null);
	let isDragging = $state(false);
	let isUploading = $state(false);
	let error = $state<string | null>(null);
	let shape = $state(defaultShape);

	const maxSizeBytes = maxSizeMB * 1024 * 1024;

	// Cleanup effect using $effect
	$effect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	});

	async function processImage(file: File): Promise<File> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			img.onload = () => {
				const size = Math.min(img.width, img.height);
				canvas.width = size;
				canvas.height = size;

				const offsetX = (img.width - size) / 2;
				const offsetY = (img.height - size) / 2;

				if (ctx) {
					ctx.drawImage(img, -offsetX, -offsetY, img.width, img.height);

					canvas.toBlob(
						(blob) => {
							if (blob) {
								resolve(new File([blob], file.name, { type: file.type }));
							} else {
								reject(new Error('Failed to process image'));
							}
						},
						file.type,
						0.8
					);
				} else {
					reject(new Error('Failed to get canvas context'));
				}
			};

			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = URL.createObjectURL(file);
		});
	}

	async function uploadProfileImage(file: File) {
		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch('/profile/upload-profile-image', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error('Failed to upload image');
		}

		return await response.json();
	}

	async function handleFiles(files: FileList | null | undefined) {
		if (!files?.length) return;

		const file = files[0];
		error = null;

		if (!allowedTypes.includes(file.type)) {
			error = `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
			return;
		}

		if (file.size > maxSizeBytes) {
			error = `File too large. Maximum size: ${maxSizeMB}MB`;
			return;
		}

		try {
			isUploading = true;
			previewUrl = URL.createObjectURL(file);

			const processedFile = await processImage(file);
			uploadProfileImage(processedFile);
		} catch (err) {
			error = 'Failed to upload image';
			console.error(err);
		} finally {
			isUploading = false;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer) {
			handleFiles(e.dataTransfer.files);
		}
	}

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		handleFiles(target.files);
	}
</script>

<div class="mx-auto w-full max-w-md">
	<div class="flex flex-col items-center gap-4">
		<!-- Drag-and-drop or file selection area -->
		<div
			role="application"
			class={twMerge(
				'flex h-32 w-32 items-center justify-center overflow-hidden border-2 border-dashed border-gray-300',
				shape === 'round' ? 'rounded-full' : 'rounded-lg',
				isDragging ? 'border-blue-500 bg-blue-50' : '',
				'relative'
			)}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			{#if previewUrl}
				<img src={previewUrl} alt="Preview" class="h-full w-full object-cover" />
			{:else}
				<button class="p-4 text-center text-gray-400" onclick={() => fileInput?.click()}>
					<span class="block">Drag & Drop</span>
					<span class="block">or</span>
					<span class="block">Click to Upload</span>
				</button>
			{/if}

			{#if isUploading}
				<div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"
					></div>
				</div>
			{/if}
		</div>

		<!-- File input -->
		<input
			type="file"
			accept={allowedTypes.join(',')}
			class="hidden"
			bind:this={fileInput}
			onchange={handleChange}
		/>

		<!-- Upload button -->
		<Button variant="link" onclick={() => fileInput?.click()} disabled={isUploading}
			>{isUploading ? 'Uploading...' : 'Edit Avatar'}</Button
		>

		<!-- Error message -->
		{#if error}
			<p class="text-sm text-red-500">{error}</p>
		{/if}
	</div>
</div>
