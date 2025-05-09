<script lang="ts">
	import { Image } from '@unpic/svelte';
	import { blurhashToCssGradientString, blurhashToDataUri } from '@unpic/placeholder';
	import { Play } from 'lucide-svelte';

	let {
		url,
		wPixel,
		hPixel,
		fileName,
		urlActive = false, // TODO: this is a fucking terribly named param. It seems to be on its head. Look into it and rename if necessary.
		blurhash,
		fileType,
		preview = null
	} = $props();

	const isVideo = fileType.startsWith('video/');

	const getPlaceholder = () => {
		if (!blurhash) {
			return {
				cssGradientString: blurhashToCssGradientString('LEHV6nWB2yk8pyo0adR*.7kCMdnj'), // Fallback gray background
				dataUri: null,
				gradient: null
			};
		}

		try {
			return {
				cssGradientString: blurhashToCssGradientString(blurhash),
				dataUri: blurhashToDataUri(blurhash, 32, 32), // Larger size for video posters
				gradient: blurhashToCssGradientString(blurhash)
			};
		} catch (error) {
			console.error('Error processing blurhash:', error);
			return {
				cssGradientString: blurhashToCssGradientString('LEHV6nWB2yk8pyo0adR*.7kCMdnj'),
				dataUri: null,
				gradient: null
			};
		}
	};

	const placeholder = getPlaceholder();
	// console.log('fileName', fileName, 'placeholder', placeholder);

	// Create a blob URL from the data URI for video poster
	let posterUrl = $state('');
	$effect(() => {
		if (isVideo && (preview?.URL || placeholder.dataUri)) {
			const dataURItoBlob = (dataURI: string) => {
				const byteString = atob(dataURI.split(',')[1]);
				const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
				const ab = new ArrayBuffer(byteString.length);
				const ia = new Uint8Array(ab);
				for (let i = 0; i < byteString.length; i++) {
					ia[i] = byteString.charCodeAt(i);
				}
				return new Blob([ab], { type: mimeString });
			};

			posterUrl = preview?.URL ?? URL.createObjectURL(dataURItoBlob(placeholder.dataUri));
		}
	});
	$effect(() => {
		console.log('urlActive', urlActive);
	});
</script>

<a
	href={url}
	target="_blank"
	rel="noreferrer"
	class={`gallery-item ${urlActive ? '' : 'disabled-link'}`}
	data-pswp-width={wPixel}
	data-pswp-height={hPixel}
	data-pswp-is-video={isVideo}
>
	{@render mediaFile()}
</a>

{#snippet mediaFile()}
	<div
		class="relative aspect-[5/3] w-full overflow-hidden rounded-lg bg-gray-200 duration-300 animate-in fade-in zoom-in"
	>
		{#if fileType.startsWith('image/')}
			<Image
				width={wPixel}
				class="h-full w-full object-cover"
				src={url}
				layout="constrained"
				aspectRatio={5 / 3}
				alt={fileName}
				background={placeholder.cssGradientString}
			/>
		{:else if isVideo}
			{#if preview}
				<!-- Show preview for videos if available -->
				<Image
					width={wPixel}
					class="h-full w-full object-cover"
					src={preview.URL ?? ''}
					layout="constrained"
					aspectRatio={5 / 3}
					alt={fileName}
					background={placeholder.cssGradientString}
				/>
				<!-- Play icon in the center of the preview image -->
				<div class="absolute inset-0 flex items-center justify-center">
					<Play class="h-10 w-10 text-white sm:h-16 sm:w-16" />
				</div>
				<video
					class="hidden rounded-lg"
					src={url}
					poster={posterUrl || (preview.URL ?? '')}
					controls
					width={wPixel}
					height={hPixel}
					>{fileName}<track kind="captions" />
					Your browser does not support the video tag.
				</video>
			{:else}
				<video
					class="absolute inset-0 h-full w-full object-cover"
					src={url}
					poster={posterUrl}
					controls
					width={wPixel}
					height={hPixel}
					>{fileName}<track kind="captions" />
					Your browser does not support the video tag.
				</video>
			{/if}
		{/if}
	</div>
{/snippet}

<style>
	.disabled-link {
		pointer-events: none; /* Disable all mouse interactions */
		cursor: default; /* Change the cursor to indicate no interaction */
	}
</style>
