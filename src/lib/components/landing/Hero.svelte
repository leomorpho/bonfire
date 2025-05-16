<script lang="ts">
	import { Button } from '$lib/jsrepo/ui/button';
	import { getNextFont, getNextTheme } from '$lib/styles';
	import { PaintBucket, RefreshCw, TypeOutline } from 'lucide-svelte';
	import Container from '../Container.svelte';
	import AnimatedShinyText from '../effects/animated-shiny-text/AnimatedShinyText.svelte';

	const titleFont = JSON.parse('{}');
	const subtitleFont = JSON.parse('{}');

	const fontElementId = 'dynamic-preview-font';

	let backgroundStyle = $state(`
      	background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/naranjas.png');
		background-repeat: repeat;
		background-size: auto;
		background-color: #ffffff; /* Fallback background color */
		width: 100%;
		height: 100%;
  `);

	let font = $state();

	const getRandomTheme = () => {
		backgroundStyle = getNextTheme();
	};

	const getRandomFont = () => {
		font = getNextFont();

		// Remove any existing style element with the same ID if it is a child of the head
		const existingFontElement = document.getElementById(fontElementId);
		if (existingFontElement && document.head.contains(existingFontElement)) {
			document.head.removeChild(existingFontElement);
		}

		// Add the font CDN link to the document head if a font is selected
		if (font && font.cdn) {
			const fontLink = document.createElement('link');
			fontLink.id = fontElementId;
			fontLink.href = font.cdn;
			fontLink.rel = 'stylesheet';
			document.head.appendChild(fontLink);
		}
	};

	let styles = $derived(`
		${font ? font.style : ''}
		${backgroundStyle}

		/* Define CSS variables for gradient height */
		--gradient-height: 30%; /* Adjust this value to control the height of the gradient */

		/* Apply a mask to fade the image */
		mask-image:
			linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0)),
			linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0));
		mask-size: 100% 100%;
		mask-repeat: no-repeat;
		mask-position: top, bottom;
		-webkit-mask-image:
			linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0)),
			linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0));
		-webkit-mask-size: 100% 100%;
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: top, bottom; 	
  `);

	$effect(() => {
		console.log('styles', styles);
	});
</script>

{#snippet startBonfireBtn()}
	<div class="flex items-center justify-center sm:justify-start">
		<a href="/bonfire/create">
			<Button id="create-bonfire-button">
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
<div style={styles}>
	<div id="dynamic-preview-font" class="bg-slate-100/70 py-20 dark:bg-slate-900/70">
		<Container>
			<div class="flex w-full justify-center space-x-2">
				<Button
					class="justify-centerp-4 flex items-center bg-violet-600 hover:bg-violet-500 dark:bg-violet-700 dark:text-white dark:hover:bg-violet-500"
					onclick={getRandomTheme}
				>
					<PaintBucket class="mr-1" />
					<RefreshCw class="mr-1" />
				</Button>
				<Button
					class="flex items-center justify-center bg-violet-600 p-4 hover:bg-violet-500 dark:bg-violet-700 dark:text-white dark:hover:bg-violet-500"
					onclick={getRandomFont}
				>
					<TypeOutline class="mr-1" />
					<RefreshCw class="mr-1" />
				</Button>
			</div>

			<div class="relative flex w-full flex-col items-center justify-center md:flex-row">
				<div class="my-5 flex w-fit flex-col justify-center md:flex-row md:space-x-3">
					<div class="flex w-full justify-center">
						<div
							style={titleFont?.style}
							class="pointer-events-none z-10 whitespace-pre-wrap bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text p-1 text-center text-6xl font-bold leading-none tracking-tighter text-transparent sm:mt-8 sm:text-left sm:text-7xl"
						>
							Face-to-Face <br />Socializing
						</div>
					</div>
					<div class="flex w-full flex-col justify-center">
						<p
							style={subtitleFont?.style}
							class="text-md mb-6 mt-5 text-center sm:mb-8 sm:mt-7 sm:text-left sm:text-lg"
						>
							Host your own in-person events or join our curated experiences to meet like-minded
							individuals in your city!
						</p>
						{@render startBonfireBtn()}
					</div>
				</div>
			</div>
		</Container>
	</div>
</div>
