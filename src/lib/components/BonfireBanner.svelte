<script>
	import { BannerMediaSize } from '$lib/enums';
	import { blurhashToCssGradientString } from '@unpic/placeholder';
	import { Image } from '@unpic/svelte';
	import { Pen } from 'lucide-svelte';

	let { bannerSmallSizeUrl, bannerLargeSizeUrl, isCurrenUserEventAdmin, blurhash } = $props();

	const placeholder = blurhashToCssGradientString(blurhash ?? 'LEHV6nWB2yk8pyo0adR*.7kCMdnj');
</script>

<div class="relative inline-block">
	<Image
		background={placeholder}
		width={BannerMediaSize.LARGE_WIDTH}
		class="hidden rounded-lg sm:block"
		src={bannerLargeSizeUrl}
		layout="constrained"
		aspectRatio={2 / 1}
		alt={'Banner for large screens'}
	/>
	<Image
		background={placeholder}
		width={BannerMediaSize.SMALL_WIDTH}
		class="block rounded-lg sm:hidden"
		src={bannerSmallSizeUrl}
		layout="constrained"
		aspectRatio={2 / 1}
		alt={'Banner for mobile'}
	/>
	{#if isCurrenUserEventAdmin}
		<div
			class="absolute right-2 top-2 rounded-full bg-white p-2 shadow-md hover:bg-slate-100 dark:bg-slate-800 dark:text-white"
		>
			<a class="flex w-full" href="banner/upload" aria-label="Upload a new banner">
				<Pen  class="w-5 h-5 no-shrink"/>
			</a>
		</div>
	{/if}
</div>
