<script lang="ts">
	import { Image } from '@unpic/svelte';
	import { blurhashToImageCssString } from '@unpic/placeholder';
	import { Play } from 'lucide-svelte';

	let {
		url,
		wPixel,
		hPixel,
		fileName,
		urlActive = false,
		blurhash,
		fileType,
		preview = null
	} = $props();

	// TODO: only load image when it crosses screen
	// TODO: blurhash not working for now, not sure why
	const placeholder = blurhash
		? blurhashToImageCssString(blurhash)
		: 'L9S#oNN3x_?wxUn%wct8pLaIxuf,';

	const isVideo = fileType.startsWith('video/');
</script>

<a
	href={url}
	class={`gallery-item ${urlActive ? 'disabled-link' : ''}`}
	data-pswp-width={wPixel}
	data-pswp-height={hPixel}
	data-pswp-is-video={isVideo}
>
	<div class="relative aspect-[5/3] w-full overflow-hidden rounded-lg bg-gray-200">
		{#if fileType.startsWith('image/')}
			<Image
				width={wPixel}
				class="h-full w-full object-cover"
				src={url}
				layout="constrained"
				aspectRatio={5 / 3}
				alt={fileName}
				background={placeholder}
			/>
		{:else if isVideo}
			{#if preview}
				<!-- Show preview for videos if available -->
				<img
					class="h-full w-full object-cover"
					src={preview.URL}
					alt={fileName}
					width={wPixel}
					height={hPixel}
				/>
				<!-- Play icon in the center of the preview image -->
				<div class="absolute inset-0 flex items-center justify-center">
					<Play class="h-10 w-10 text-white sm:h-16 sm:w-16" />
				</div>
				<video
					class="hidden rounded-lg"
					src={url}
					poster={placeholder}
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
					poster={placeholder}
					controls
					width={wPixel}
					height={hPixel}
					>{fileName}<track kind="captions" />
					Your browser does not support the video tag.
				</video>
			{/if}
		{/if}
	</div>
</a>

<style>
	.disabled-link {
		pointer-events: none; /* Disable all mouse interactions */
		cursor: default; /* Change the cursor to indicate no interaction */
	}
</style>
