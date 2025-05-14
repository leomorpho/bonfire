<script lang="ts">
	import { Button } from '$lib/jsrepo/ui/button';
	import Container from '../Container.svelte';
	import AnimatedShinyText from '../effects/animated-shiny-text/AnimatedShinyText.svelte';

	const titleFont = JSON.parse("{}")
	const subtitleFont = JSON.parse("{}")


</script>

{#snippet startBonfireBtn()}
	<div class="flex items-center justify-center sm:justify-start">
		<a href="/bonfire/create">
			<Button>
				✨
				<AnimatedShinyText
					cls="inline-flex items-center justify-center px-2 sm:px-4 sm:py-1 transition text-sm sm:text-base ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400 text-white dark:text-black"
				>
					<span>Create an event</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
					>
						<path d="M5 12h14" />
						<path d="m12 5 7 7-7 7" />
					</svg>
				</AnimatedShinyText>
			</Button>
		</a>
		<div class="mx-3 italic">it's free!</div>
	</div>
{/snippet}

<Container>
	<div class="relative flex w-full flex-col items-center justify-center md:flex-row">
		<div class="flex w-fit flex-col justify-center">
			<div style={titleFont?.style}
				class="pointer-events-none z-10 whitespace-pre-wrap bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text p-1 text-center text-6xl font-bold leading-none tracking-tighter text-transparent sm:mt-8 sm:text-left sm:text-7xl"
			>
				Effortless <br />Gatherings
			</div>
			<p style={subtitleFont?.style} class="text-md mb-6 mt-5 text-center sm:mb-8 sm:mt-7 sm:text-left sm:text-lg">
				The simplest way to keep your guests up to date.
			</p>
			{@render startBonfireBtn()}
		</div>
	</div>
</Container>
