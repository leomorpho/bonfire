<script lang="ts">
	import { BannerMediaSize } from '$lib/enums';
	import { blurhashToCssGradientString } from '@unpic/placeholder';
	import { Image } from '@unpic/svelte';
	import { Pen } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	let {
		bannerSmallSizeUrl,
		bannerLargeSizeUrl,
		isCurrenUserEventAdmin = false,
		blurhash
	} = $props();

	const placeholder = blurhashToCssGradientString(blurhash ?? 'LEHV6nWB2yk8pyo0adR*.7kCMdnj');

	let largeImageLoaded = $state(false);
	let smallImageLoaded = $state(false);

	const handleImageLoad = (size: string) => {
		if (size === 'large') {
			largeImageLoaded = true;
		} else if (size === 'small') {
			smallImageLoaded = true;
		}
	};
</script>

<div class="image-container relative inline-block">
	<div class="image-wrapper hidden rounded-xl sm:block">
		{#if !largeImageLoaded}
			<img
				style="display: none;"
				src={bannerLargeSizeUrl}
				alt="Preload large image, but there is no actual image"
				onload={() => handleImageLoad('large')}
			/>
			{@render skeleton()}
		{/if}
		{#if largeImageLoaded}
			<div in:fade={{ duration: 800 }}>
				<Image
					priority={true}
					background={placeholder}
					width={BannerMediaSize.LARGE_WIDTH}
					class="rounded-xl"
					src={bannerLargeSizeUrl}
					layout="constrained"
					aspectRatio={2 / 1}
					alt={'Banner for large screens'}
				/>
			</div>
		{/if}
	</div>
	<div class="image-wrapper block rounded-xl sm:hidden">
		{#if !smallImageLoaded}
			<img
				style="display: none;"
				src={bannerSmallSizeUrl}
				alt="Preload small image, but there is no actual image"
				onload={() => handleImageLoad('small')}
			/>
			{@render skeleton()}
		{/if}
		{#if smallImageLoaded}
			<div in:fade={{ duration: 800 }}>
				<Image
					priority={true}
					background={placeholder}
					width={BannerMediaSize.SMALL_WIDTH}
					class="rounded-xl"
					src={bannerSmallSizeUrl}
					layout="constrained"
					aspectRatio={2 / 1}
					alt={'Banner for mobile'}
				/>
			</div>
		{/if}
	</div>
	{#if isCurrenUserEventAdmin}
		<div
			class="absolute right-2 top-2 rounded-full bg-white p-2 shadow-md hover:bg-slate-100 dark:bg-slate-800 dark:text-white"
		>
			<a class="flex w-full" href="banner/upload" aria-label="Upload a new banner">
				<Pen class="no-shrink h-5 w-5" />
			</a>
		</div>
	{/if}
</div>

{#snippet skeleton()}
	<div
		class="skeleton-loader animate-pulse bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-700 dark:to-slate-800"
	></div>
{/snippet}

<style>
	.image-container {
		position: relative;
		width: 100%;
		padding-top: 50%; /* Maintain a 2:1 aspect ratio */
	}
	.image-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.image-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.skeleton-loader {
		width: 100%;
		height: 100%;
		background-size: 200% 100%;
		border-radius: 0.75rem; /* Match the rounded-xl class */
	}
</style>
