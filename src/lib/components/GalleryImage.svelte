<script lang="ts">
	import { Image } from '@unpic/svelte';
	import { blurhashToImageCssString } from "@unpic/placeholder";

	let { url, wPixel, hPixel, fileName, selectionActive, blurhash } = $props();

	const placeholder = blurhashToImageCssString(blurhash);
</script>

<a
	href={url}
	class={selectionActive ? 'disabled-link' : ''}
	data-pswp-width={wPixel}
	data-pswp-height={hPixel}
>
	<Image
		height={hPixel}
		class="rounded-lg"
		src={url}
		layout="constrained"
		aspectRatio={5 / 3}
		alt={fileName}
		background={placeholder}
	/>
</a>
