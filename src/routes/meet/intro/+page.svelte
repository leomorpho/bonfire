<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { slide } from 'svelte/transition';
	import { fade } from 'svelte/transition';

	let currentPaneIndex = $state(0);
	let slideDirection = $state('up');

	const nextPane = () => {
		slideDirection = 'up';
		currentPaneIndex++;
	};

	const prevPane = () => {
		if (currentPaneIndex > 0) {
			slideDirection = 'down';
			currentPaneIndex--;
		}
	};
	const styles = `				
         background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/kiwis.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   	
  `;
	const overlayStyle = 'background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.4);';
</script>

<div class="bg-color h-[90vh] w-full" style={styles}>
	<div class="bg-overlay h-[90vh]" style={overlayStyle}>
		<div
			class="mx-auto flex h-[90vh] flex-col items-center justify-center p-4 sm:w-2/3 md:w-1/2 xl:w-2/5"
		>
			<div
				class="w-full"
				in:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 300 }}
				out:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 100 }}
			>
				<div transition:fade={{ duration: 300 }} class="rounded-xl bg-slate-800/80 p-3 text-base">
					<h2 class="mb-4 text-center text-xl font-bold">Welcome to Bonfire!</h2>
					<p class="mb-2 text-center">
						Bonfire is your go-to platform for connecting with people and organizing events.
					</p>
					<p class="mb-2 text-center">
						With Bonfire Meet, you can join curated events and meet new people in your city. We'll
						match you with others based on a short questionnaire, and organize events for you and
						people we think you'll like.
					</p>
					<p class="mb-2 text-center">
						But remember, you don't have to sign up for Bonfire Meet! You can also use Bonfire to
						organize your own events with your friends.
					</p>
					<p class="mb-2 text-center">
						Ready to make new friends or plan your next gathering? Let's get started!
					</p>

					<div class="mt-8 flex justify-center space-x-4">
						<Button
							href="/dashboard"
							class="rounded bg-orange-800 px-4 py-2 text-white hover:bg-orange-700"
						>
							Maybe later
						</Button>
						<Button
							href="/meet/welcome"
							class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
						>
							Let's get started! 🥳
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
