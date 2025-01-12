<script lang="ts">
	import { Image } from '@unpic/svelte';
	import { blurhashToImageCssString } from '@unpic/placeholder';

	let { url, wPixel, hPixel, fileName, selectionActive, blurhash, fileType } = $props();

	const placeholder = blurhash
		? blurhashToImageCssString(blurhash)
		: 'L9S#oNN3x_?wxUn%wct8pLaIxuf,';
</script>

<a
	href={url}
	class={selectionActive ? 'disabled-link' : ''}
	data-pswp-width={wPixel}
	data-pswp-height={hPixel}
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
	{:else if fileType.startsWith('video/')}
		<video class="rounded-lg" src={url} poster={placeholder} controls width={wPixel} height={hPixel}
			>{fileName}<track kind="captions" />
			Your browser does not support the video tag.
		</video>
	{/if}
</a>
