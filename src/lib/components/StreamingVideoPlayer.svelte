<script>
	import Hls from 'hls.js';
	import { onMount } from 'svelte';

	let { masterm3u8Url, cls = null } = $props();
	let videoElement = $state();

	onMount(() => {
		if (Hls.isSupported()) {
			const hls = new Hls();
			hls.loadSource(masterm3u8Url);
			hls.attachMedia(videoElement);
			hls.on(Hls.Events.MANIFEST_PARSED, function () {
				videoElement.play();
			});
		} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
			videoElement.src = 'path/to/your/master.m3u8';
			videoElement.addEventListener('loadedmetadata', function () {
				videoElement.play();
			});
		}
	});
</script>

<video class={cls} bind:this={videoElement} autoplay loop muted playsinline></video>

<style>
	video {
		width: 100%;
		height: auto;
	}
</style>
