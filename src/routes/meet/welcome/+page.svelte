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
        background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/cuadros.png'); /* Replace with the URL of your tileable image */
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
			<!-- Pane 1 -->
			{#if currentPaneIndex === 0}
				<div
					class="w-full"
					in:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 300 }}
					out:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 100 }}
				>
					<div transition:fade={{ duration: 300 }} class="rounded-xl bg-slate-800/80 p-3">
						<h2 class="mb-4 text-center text-xl font-bold">Welcome to Bonfire Meet!</h2>
						<p class="text-center">
							Bonfire Meet is designed to bring people together in real life, turning local
							strangers into possible new best friends.
						</p>
						<div class="mt-8 flex justify-center space-x-4">
							<Button
								onclick={nextPane}
								class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			{:else if currentPaneIndex === 1}
				<!-- Pane 2 -->
				<div
					class="w-full"
					in:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 300 }}
					out:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 100 }}
				>
					<div transition:fade={{ duration: 300 }} class="rounded-xl bg-slate-800/80 p-3">
						<h2 class="mb-4 text-center text-xl font-bold">How it works</h2>
						<p class="mb-2 text-center">
							We match you with other people based on a short questionnaire that you will fill next.
						</p>
						<p class="mb-2 text-center">
							Then, we'll organize curated events on Bonfire for you and people we think you'll
							like. We'll invite you once we got enough people in your area!
						</p>
						<p class="mb-2 text-center">
							Prepare to make new friends!
						</p>

						<div class="mt-8 flex justify-center space-x-4">
							<Button
								onclick={prevPane}
								class="rounded bg-orange-800 px-4 py-2 text-white hover:bg-orange-700"
							>
								Back
							</Button>
							<Button
								href="/meet/questionnaire"
								onclick={() => {
									/* Start the questionnaire */
								}}
								class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
							>
								Let's get started! 🥳
							</Button>
						</div>
					</div>
				</div>
			{:else if currentPaneIndex === 2}
				<!-- <div
					class="w-full"
					in:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 300 }}
					out:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 100 }}
				>
					<div transition:fade={{ duration: 300 }} class="rounded-xl bg-slate-800/80 p-3">
						<h2 class="mb-4 text-center text-xl font-bold">How much does it cost?</h2>
						<p class="mb-2 text-center">
							Use Bonfire Logs, our internal currency, for pay-as-you-go convenience. Buy in bulk
							for savings and enjoy rewards when you deserve them! Curated events typically cost
							between $5 and $15, depending on the location.
						</p>
						<div class="mt-8 flex justify-center space-x-4">
							<Button
								onclick={prevPane}
								class="rounded bg-orange-800 px-4 py-2 text-white hover:bg-orange-700"
							>
								Back
							</Button>
							<Button
								href="/meet/questionnaire"
								onclick={() => {
									/* Start the questionnaire */
								}}
								class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
							>
								Let's get started! 🥳
							</Button>
						</div>
					</div>
				</div> -->
			{/if}
		</div>
	</div>
</div>
