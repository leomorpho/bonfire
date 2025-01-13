<script lang="ts">
	import { Image } from '@unpic/svelte';
	import { blurhashToImageCssString } from '@unpic/placeholder';
	import { Play } from 'lucide-svelte';

	let {
		url,
		wPixel,
		hPixel,
		fileName,
		selectionActive,
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
	console.log('preview', preview);
</script>

<a
	href={url}
	class={selectionActive ? 'disabled-link' : ''}
	data-pswp-width={wPixel}
	data-pswp-height={hPixel}
	data-pswp-is-video={isVideo}
>
	{#if fileType.startsWith('image/')}
		<Image
			height={hPixel}
			class="rounded-lg"
			src={url}
			layout="constrained"
			aspectRatio={5 / 3}
			alt={fileName}
			background={placeholder}
		/>
	{:else if isVideo}
		{#if preview}
			<!-- Show preview for videos if available -->
			<div class="relative rounded-lg">
				<img class="rounded-lg" src={preview.URL} alt={fileName} width={wPixel} height={hPixel} />
				<!-- Play icon in the center of the preview image -->
				<div class="absolute inset-0 flex items-center justify-center">
					<Play class="text-white h-10 w-10 sm:h-16 sm:w-16" />
				</div>
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
				class="rounded-lg"
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
</a>
