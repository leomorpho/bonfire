<script>
	import Container from '../Container.svelte';
	import AnimatedShinyText from '../effects/animated-shiny-text/AnimatedShinyText.svelte';
	import Button from '../ui/button/button.svelte';
	import OrbitingCirclesBanner from './OrbitingCirclesBanner.svelte';
</script>

{#snippet startBonfireBtn()}
	<div class="flex items-center justify-center sm:justify-start">
		<a href="/login">
			<div
				class="group relative inline-flex h-14 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-black/5 bg-neutral-100 px-6 text-lg text-white transition-all ease-in hover:bg-neutral-200 dark:border-white/20 dark:bg-neutral-900 dark:hover:bg-neutral-800"
			>
				✨
				<AnimatedShinyText
					cls="inline-flex items-center justify-center px-2 sm:px-4 sm:py-1 transition text-sm  sm:text-base ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
				>
					<span>Start a Bonfire</span>
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
			</div>
		</a>
		<div class="mx-3 italic">it's free!</div>
	</div>
{/snippet}

<Container>
	<div class="relative flex w-full flex-col items-center justify-center md:flex-row">
		<div>
			<div
				class="pointer-events-none z-10 whitespace-pre-wrap bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text p-1 text-center text-6xl font-bold leading-none tracking-tighter text-transparent sm:mt-8 sm:text-left sm:text-7xl"
			>
				Plan, Share, <br /><span class="underline decoration-purple-500">Enjoy</span>
			</div>
			<p class="text-md mb-6 mt-5 text-center sm:mb-8 sm:mt-7 sm:text-left sm:text-lg">
				Organize and share gatherings effortlessly.
			</p>
			{@render startBonfireBtn()}
		</div>

		<div class="hidden w-full min-w-[450px] p-5 sm:block sm:w-2/3 sm:p-10 md:w-1/2">
			<OrbitingCirclesBanner />
		</div>
	</div>
</Container>
<div class="mt-2 block overflow-x-clip sm:hidden sm:py-10">
	<OrbitingCirclesBanner rounded={false} />
</div>
