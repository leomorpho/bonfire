<script lang="ts">
	import { Image } from '@unpic/svelte';

	let { image, setBannerImage } = $props();

	let buttonElement: HTMLElement;
	let authorNameElement: HTMLElement;
</script>

<button
	onclick={() => {
		setBannerImage(image);
	}}
	class="relative w-full overflow-hidden rounded-lg bg-gray-200 duration-300 animate-in fade-in zoom-in"
	onmouseenter={() => {
		// Add hover class to show overlay and author name
		buttonElement.classList.add('hover:bg-blue-400/50');
		authorNameElement.classList.remove('hidden');
	}}
	onmouseleave={() => {
		// Remove hover class to hide overlay and author name
		buttonElement.classList.remove('hover:bg-blue-400/50');
		authorNameElement.classList.add('hidden');
	}}
	bind:this={buttonElement}
>
	<Image
		src={image.urls.small_s3}
		aspectRatio={image.width / image.height}
		class="h-full w-full object-cover"
		layout="constrained"
		alt={image.alt_description}
	/>
	<div class="absolute bottom-1 left-2 hidden text-sm" bind:this={authorNameElement}>
		{image.user.name}
	</div>
</button>

<style>
	button:hover::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(56, 189, 248, 0.3); /* Blue overlay color */
		pointer-events: none;
		opacity: 1; /* Fully visible on hover */
	}

	button::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(56, 189, 248, 0.3); /* Blue overlay color */
		pointer-events: none;
		opacity: 0; /* Hidden by default */
		transition: opacity 0.1s ease-in-out; /* Smooth transition */
	}
</style>