<script lang="ts">
	// even though it works typescript complains about onemblaInit instead of on:emblaInit
	import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
	import emblaCarouselSvelte from 'embla-carousel-svelte';

	import {
		Aperture,
		BellRing,
		Dice6,
		Drama,
		Factory,
		Flame,
		Images,
		Link,
		Music,
		Smile,
		Users
	} from 'lucide-svelte';
	import Container from './Container.svelte';

	let emblaApi: EmblaCarouselType;
	let index = $state(0);

	const options: EmblaOptionsType = {
		align: 'center',
		loop: true,
		inViewThreshold: 1
	};

	function updateSelected(emblaApi: EmblaCarouselType): void {
		let slidesIndexes = emblaApi.slidesInView();
		if (slidesIndexes.length > 0) {
			index = slidesIndexes[0];
		}
	}

	function onInit(event: { detail: EmblaCarouselType }) {
		emblaApi = event.detail;
		emblaApi.on('slidesInView', updateSelected);
	}

	function setIndex(newIndex: number) {
		index = newIndex;
		emblaApi.scrollTo(index);
	}
</script>

<Container>
	<div class="py-24 md:py-32">
		<h2 class="mb-16 text-center text-2xl font-bold md:text-4xl">
			Everything you need to fix your problem right now
		</h2>
		<!-- on mobile show small icons without text -->
		<div class="mx-auto mb-5 w-fit sm:hidden">
			<div class="join">
				<button class:btn-primary={index === 0} class="btn join-item" onclick={() => setIndex(0)}
					><Flame class="h-4 w-4" />
				</button>
				<button class:btn-primary={index === 1} class="btn join-item" onclick={() => setIndex(1)}
					><Link class="h-4 w-4" /></button
				>
				<button class:btn-primary={index === 2} class="btn join-item" onclick={() => setIndex(2)}
					><Users class="h-4 w-4" /></button
				>
				<button class:btn-primary={index === 3} class="btn join-item" onclick={() => setIndex(3)}
					><Music class="h-4 w-4" /></button
				>
				<button class:btn-primary={index === 4} class="btn join-item" onclick={() => setIndex(4)}
					><Images class="h-4 w-4" /></button
				>
				<button class:btn-primary={index === 5} class="btn join-item" onclick={() => setIndex(5)}
					><BellRing class="h-4 w-4" /></button
				>
			</div>
		</div>

		<!-- on desktop show large icons with text -->
		<div class="mx-auto hidden w-fit space-x-10 sm:flex">
			<button
				class:text-primary={index === 0}
				class="flex flex-col items-center"
				onclick={() => setIndex(0)}
				><Flame class="h-10 w-10" />
				<div class="mt-2 text-xl font-semibold">Plan</div>
			</button>
			<button
				class:text-primary={index === 1}
				class="flex flex-col items-center"
				onclick={() => setIndex(1)}
				><Link class="h-10 w-10" />
				<div class="mt-2 text-xl font-semibold">Share</div></button
			>
			<button
				class:text-primary={index === 2}
				class="flex flex-col items-center"
				onclick={() => setIndex(2)}
				><Users class="h-10 w-10" />
				<div class="mt-2 text-xl font-semibold">Attendees</div></button
			>
			<button
				class:text-primary={index === 3}
				class="flex flex-col items-center"
				onclick={() => setIndex(3)}
				><Music class="h-10 w-10" />
				<div class="mt-2 text-xl font-semibold">Playlists</div></button
			>
			<button
				class:text-primary={index === 4}
				class="flex flex-col items-center"
				onclick={() => setIndex(4)}
				><Images class="h-10 w-10" />
				<div class="mt-2 text-xl font-bold">Memories</div></button
			>
			<button
				class:text-primary={index === 5}
				class="flex flex-col items-center"
				onclick={() => setIndex(5)}
				><BellRing class="h-10 w-10" />
				<div class="mt-2 text-xl font-bold">Auto-reminders</div></button
			>
		</div>
		<div class="embla pt-14">
			<div
				class="embla__viewport"
				use:emblaCarouselSvelte={{ options, plugins: [] }}
				onemblaInit={onInit}
			>
				<div class="embla__container">
					<div class="embla__slide">
						<div
							class="flex h-80 flex-col items-center justify-center space-y-3 rounded-xl bg-slate-100 p-5 text-center"
						>
							<div class="flex items-center sm:text-xl font-bold">
								<Flame class="hidden sm:block mr-1 h-4 w-4 fill-pink-700 sm:h-5 sm:w-5" />Create a bonfire in
								seconds
							</div>
							<p class="text-xs sm:text-sm md:text-base">Creating an event is quick and simple.</p>
							<p class="text-xs sm:text-sm md:text-base">You can select from our many fun themes or upload your own image.</p>
						</div>
					</div>
					<div class="embla__slide">
						<div
							class="flex h-80 flex-col items-center justify-center space-y-3 rounded-xl bg-slate-100 p-5 text-center"
						>
							<div class="flex items-center sm:text-xl font-bold">
								<Link class="hidden sm:block mr-1 h-4 w-4 sm:h-6 sm:w-6" />Quick-share URLs
							</div>
							<p class="text-xs sm:text-sm md:text-base">Each Bonfire has a unique URL that can be shared anywhere beyond the app.</p>
							<p class="text-xs sm:text-sm md:text-base">
								Keep it private by sharing it to your close circle, or watch it grow like wildfire
								by sharing publicly on social media.
							</p>
						</div>
					</div>
					<div class="embla__slide">
						<div
							class="flex h-80 flex-col items-center justify-center space-y-3 rounded-xl bg-slate-100 p-5 text-center"
						>
							<div class="flex items-center sm:text-xl font-bold">
								<Users class="hidden sm:block mr-1 h-4 w-4 fill-yellow-500 sm:h-6 sm:w-6" />Track & Notify Attendees
							</div>
							<p class="text-xs sm:text-sm md:text-base">Track who's coming and keep the hype going by posting updates and content.</p>
							<p class="text-xs sm:text-sm md:text-base">RSVP'd users can upload their own images of the event to the group gallery.</p>
						</div>
					</div>
					<div class="embla__slide">
						<div
							class="flex h-80 flex-col items-center justify-center space-y-3 rounded-xl bg-slate-100 p-5 text-center"
						>
							<div class="flex items-center sm:text-xl font-bold">
								<Music class="hidden sm:block mr-1 h-4 w-4 sm:h-6 sm:w-6" />Shared Playlists
							</div>
							<p class="text-xs sm:text-sm md:text-base">Attach a Spotify playlist link to share a group playlist for your Bonfire.</p>
						</div>
					</div>
					<div class="embla__slide">
						<div
							class="flex h-80 flex-col items-center justify-center space-y-3 rounded-xl bg-slate-100 p-5 text-center"
						>
							<div class="flex items-center sm:text-xl font-bold">
								<Images class="hidden sm:block mr-1 h-4 w-4 sm:h-6 sm:w-6 " />Log Memories
							</div>
							<p class="text-xs sm:text-sm md:text-base">
								Store all the images from everyone at the event in one place and generate a
								highlight reel of the best moments from the event
							</p>
						</div>
					</div>
					<div class="embla__slide">
						<div
							class="flex h-80 flex-col items-center justify-center space-y-3 rounded-xl bg-slate-100 p-5 text-center"
						>
							<div class="flex items-center sm:text-xl font-bold">
								<BellRing class="hidden sm:block mr-1 h-4 w-4 fill-green-500 sm:h-6 sm:w-6" />Auto-Reminders
							</div>
							<p class="text-xs sm:text-sm md:text-base">
								Set automatic reminders for attendees to ensure they don't forget about upcoming
								events.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</Container>

<style>
	.embla {
		margin: auto;
		--slide-height: 19rem;
		--slide-spacing: 1rem;
		--slide-size: 70%;
	}
	.embla__viewport {
		overflow: hidden;
	}
	.embla__container {
		backface-visibility: hidden;
		display: flex;
		touch-action: pan-y pinch-zoom;
	}
	.embla__slide {
		flex: 0 0 var(--slide-size);
		min-width: 0;
		padding-left: var(--slide-spacing);
	}
</style>
