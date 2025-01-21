<script>
	import { BannerMediaSize } from '$lib/enums';
	import { Image } from '@unpic/svelte';

	let { bannerSmallSizeUrl, bannerLargeSizeUrl, currenUserIsEventAdmin } = $props();
</script>

<div class="relative inline-block">
	<Image
		width={BannerMediaSize.LARGE_WIDTH}
		class="hidden rounded-lg sm:block"
		src={bannerLargeSizeUrl}
		layout="constrained"
		aspectRatio={2 / 1}
		alt={'Banner for large screens'}
	/>
	<Image
		width={BannerMediaSize.SMALL_WIDTH}
		class="block rounded-lg sm:hidden"
		src={bannerSmallSizeUrl}
		layout="constrained"
		aspectRatio={2 / 1}
		alt={'Banner for mobile'}
	/>
	{#if currenUserIsEventAdmin}
		<div class="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md hover:bg-slate-100">
			<a class="flex w-full" href="banner/upload" aria-label="Upload a new banner">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="h-6 w-6 text-black"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
			</a>
		</div>
	{/if}
</div>
