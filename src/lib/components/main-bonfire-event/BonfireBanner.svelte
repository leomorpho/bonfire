<script lang="ts">
	import { BannerMediaSize } from '$lib/enums';
	import { blurhashToCssGradientString } from '@unpic/placeholder';
	import { Image } from '@unpic/svelte';
	import { Pencil } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	let {
		bannerSmallSizeUrl,
		bannerLargeSizeUrl,
		isCurrenUserEventAdmin = false,
		blurhash,
		unsplashAuthorName = '',
		unsplashAuthorUsername = ''
	} = $props();

	const placeholder = blurhashToCssGradientString(blurhash ?? 'LEHV6nWB2yk8pyo0adR*.7kCMdnj');

	let smImageLoaded = $state(false);
	let lgImageLoaded = $state(false);

	const handleImageLoad = (size: string) => {
		if (size == 'small') {
			smImageLoaded = true;
		} else if (size == 'large') {
			lgImageLoaded = true;
		}
	};

	const myUnsplashAppName = 'Bonfire';
</script>

<div class="max-h-[400px]">
	<div class="image-container inline-block">
		<div class="image-wrapper hidden rounded-xl sm:block">
			{#if !lgImageLoaded}
				<img
					style="display: none;"
					src={bannerLargeSizeUrl}
					alt="Preload large image, but there is no actual image"
					onload={() => {
						handleImageLoad('large');
					}}
				/>
				{@render skeleton()}
			{/if}
			{#if lgImageLoaded}
				<div in:fade={{ duration: 800 }} class="flex w-full justify-center">
					<div class="relative">
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
						{@render editButton()}
					</div>
				</div>
			{/if}
		</div>
		<div class="image-wrapper block rounded-xl sm:hidden">
			{#if !smImageLoaded}
				<img
					style="display: none;"
					src={bannerSmallSizeUrl}
					alt="Preload small image, but there is no actual image"
					onload={() => {
						handleImageLoad('small');
					}}
				/>
				{@render skeleton()}
			{/if}
			{#if smImageLoaded}
				<div in:fade={{ duration: 800 }} class="flex w-full justify-center">
					<div class="relative">
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
						{@render editButton()}
					</div>
				</div>
			{/if}
		</div>
	</div>
	{#if unsplashAuthorUsername && unsplashAuthorName}
		<div class="flex w-full justify-center text-sm">
			Photo by <a class="underline mx-1"
				href={`https://unsplash.com/@${unsplashAuthorUsername}?utm_source=${myUnsplashAppName}&utm_medium=referral`}
				>{unsplashAuthorName}</a
			>
			on
			<a class="underline mx-1" href={`https://unsplash.com/?utm_source=${myUnsplashAppName}&utm_medium=referral`}
				>Unsplash</a
			>
		</div>
	{/if}
</div>

{#snippet skeleton()}
	<div
		class="skeleton-loader max-h-[400px] animate-pulse bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-700 dark:to-slate-800"
	></div>
{/snippet}

{#snippet editButton()}
	{#if isCurrenUserEventAdmin}
		<div
			class="absolute right-2 top-2 rounded-full bg-white p-2 shadow-md transition-all duration-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-600"
		>
			<a class="flex w-full" href="banner/edit" aria-label="Upload a new banner">
				<Pencil class="no-shrink h-5 w-5" />
			</a>
		</div>
	{/if}
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
