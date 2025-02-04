<script lang="ts">
	import { spring } from 'svelte/motion';

	import { onMount } from 'svelte';
	import SvgLoader from './SvgLoader.svelte';

	let threshold = 80; // Pull threshold
	let isRefreshing = $state(false);
	let startY: number | null = $state(null);
	let distanceY = $state(0);
	let isMobile = $state(false);

	// Spring for smooth pull animation
	let pullHeight = spring(0, { stiffness: 0.1, damping: 0.5 });

	// Function to refresh page
	async function refreshPage() {
		await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
		window.location.reload(); // Refresh
	}

	// Handle touch start
	function handleTouchStart(event: TouchEvent) {
		if (window.scrollY > 0 || isRefreshing) return; // Only at top & prevent multiple triggers
		startY = event.touches[0].clientY;
	}

	// Handle touch move
	function handleTouchMove(event: TouchEvent) {
		if (!startY) return;
		distanceY = event.touches[0].clientY - startY;
		if (distanceY > 0) {
			event.preventDefault(); // Prevent scrolling
			pullHeight.set(Math.min(distanceY, threshold + 20)); // Grow area but limit max size
		}
	}

	// Handle touch end
	function handleTouchEnd() {
		if (distanceY > threshold) {
			isRefreshing = true;
			pullHeight.set(threshold);
			refreshPage();
		} else {
			pullHeight.set(0);
		}
		startY = null;
		distanceY = 0;
	}

	// Detect if the device is a mobile device
	onMount(() => {
		isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
		console.log('isMobile', isMobile, navigator.userAgent);

		if (isMobile) {
			window.addEventListener('touchstart', handleTouchStart);
			window.addEventListener('touchmove', handleTouchMove, { passive: false });
			window.addEventListener('touchend', handleTouchEnd);
		}
	});
</script>

<!-- Expanding pull-to-refresh area -->
{#if isMobile}
	<div
		class="z-50 flex w-full items-center justify-center bg-slate-100 dark:bg-slate-800 dark:text-white text-sm font-semibold text-gray-600"
		style="height: {$pullHeight}px;"
	>
		{#if isRefreshing}
			<SvgLoader />
		{:else if $pullHeight > 10}
			{#if $pullHeight < threshold}
				⬇️ Pull to refresh
			{:else}
				🔄 Release to refresh
			{/if}
		{/if}
	</div>
{/if}
