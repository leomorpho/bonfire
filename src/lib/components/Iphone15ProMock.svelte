<script lang="ts">
	import StreamingVideoPlayer from './StreamingVideoPlayer.svelte';

	let { width = 433, src = '', videoSrc = '' } = $props();

	// Calculate height based on the aspect ratio (9:16)
	const aspectRatio = 433 / 882;
	const height = width / aspectRatio;
</script>

<div
	class="aspect-w-2 aspect-h-3 relative mx-auto w-full max-w-[300px] rounded-[2.5rem] border-[14px] border-gray-800 bg-gray-700 dark:border-gray-800 
	sm:max-w-[320px] lg:max-w-[350px] shadow-2xl"
>
	<div
		class="absolute -start-[17px] top-[72px] h-[32px] w-[3px] rounded-s-lg bg-gray-700 dark:bg-gray-700"
	></div>
	<div
		class="absolute -start-[17px] top-[124px] h-[46px] w-[3px] rounded-s-lg bg-gray-700 dark:bg-gray-700"
	></div>
	<div
		class="absolute -start-[17px] top-[178px] h-[46px] w-[3px] rounded-s-lg bg-gray-700 dark:bg-gray-700"
	></div>
	<div
		class="absolute -end-[17px] top-[142px] h-[64px] w-[3px] rounded-e-lg bg-gray-700 dark:bg-gray-700"
	></div>
	<div class="h-full w-full overflow-hidden rounded-[2rem] bg-gray-700">
		<StreamingVideoPlayer
			masterm3u8Url={videoSrc}
			cls={'size-full overflow-hidden rounded-[20.75px] object-cover'}
		/>
	</div>
</div>
