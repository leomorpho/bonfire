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

	let imageLoaded = $state(false);

	const handleImageLoad = () => {
		imageLoaded=true
	};
</script>

<div class="max-h-[400px]">
	<div class="image-container inline-block">
		<div class="image-wrapper hidden rounded-xl sm:block">
			{#if !imageLoaded}
				<img
					style="display: none;"
					src={bannerLargeSizeUrl}
					alt="Preload large image, but there is no actual image"
					onload={handleImageLoad}
				/>
				{@render skeleton()}
			{/if}
			{#if imageLoaded}
				<div in:fade={{ duration: 800 }} class="flex w-full justify-center">
					<Image
						priority={true}
						background={placeholder}
						width={BannerMediaSize.LARGE_WIDTH}
						class="rounded-xl duration-300 animate-in fade-in"
						src={bannerLargeSizeUrl}
						layout="constrained"
						aspectRatio={2 / 1}
						alt={'Banner for large screens'}
					/>
				</div>
			{/if}
		</div>
		<div class="image-wrapper block rounded-xl sm:hidden">
			{#if !imageLoaded}
				<img
					style="display: none;"
					src={bannerSmallSizeUrl}
					alt="Preload small image, but there is no actual image"
					onload={handleImageLoad}
				/>
				{@render skeleton()}
			{/if}
			{#if imageLoaded}
				<div in:fade={{ duration: 800 }} class="flex w-full justify-center">
					<Image
						priority={true}
						background={placeholder}
						width={BannerMediaSize.SMALL_WIDTH}
						class="rounded-xl duration-300 animate-in fade-in"
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
</div>

{#snippet skeleton()}
	<div
		class="skeleton-loader max-h-[400px] animate-pulse bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-700 dark:to-slate-800"
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
