<script lang="ts">
	import FadeIn from '$lib/components/containers/FadeIn.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Gift, PartyPopper } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadScript, redirectToTempAttendanceInBonfireIfAvailable } from '$lib/utils';
	import { page } from '$app/stores';
	import { getFeHttpTriplitClient, getFeWorkerTriplitClient } from '$lib/triplit';
	import type { HttpClient, TriplitClient } from '@triplit/client';
	import type { WorkerClient } from '@triplit/client/worker-client';
	import KeyBoardShortcut from '$lib/components/KeyBoardShortcut.svelte';

	let jsConfetti: any;
	let client: TriplitClient | HttpClient | WorkerClient;

	onMount(() => {
		client = getFeHttpTriplitClient($page.data.jwt);

		const initConfetti = async () => {
			await loadScript(
				'https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js'
			);

			// Ensure JSConfetti is available globally
			if (window.JSConfetti) {
				jsConfetti = new window.JSConfetti();

				// Spread confetti over time (staggered effect)
				const confettiBursts = [
					['🔥', '🎉', '✨'], // Initial celebration
					['🏕️', '🎶', '🌙'], // Camping, music, and night vibes
					['🎆', '🔥', '🥳'] // Fireworks, fire, party
				];

				confettiBursts.forEach((emojis, index) => {
					setTimeout(() => {
						jsConfetti.addConfetti({
							emojis,
							confettiColors: ['#ff4500', '#ffcc00', '#ff6600', '#FFD700'],
							confettiRadius: 9,
							confettiNumber: 40
						});
					}, index * 350); // Delays each burst by 800ms
				});
			} else {
				console.error('JSConfetti not found. Ensure the script is loaded in index.html.');
			}
		};

		initConfetti();
	});

	const claimLogs = async () => {
		await client.update('user', $page.data.user.id, async (entity: any) => {
			entity.is_fully_onboarded = true;
		});

		const tempAttendanceUrl = await redirectToTempAttendanceInBonfireIfAvailable();
		if (tempAttendanceUrl) {
			goto(tempAttendanceUrl);
		}

		goto('/onboarding/permissions'); // Redirect users to their dashboard
	};

	const styles = `background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/asteroids.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
  `;
	const overlayStyle = 'background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.4);';
</script>

<KeyBoardShortcut
	key="Enter"
	callback={() => {
		document.getElementById('agree-to-free-logs-btn')?.click();
	}}
/>

<div class="bg-color min-h-screen w-full" style={styles}>
	<div class="bg-overlay min-h-screen" style={overlayStyle}>
		<div class="center-screen md:p-10">
			<FadeIn>
				<div
					class="w-90 mx-4 flex flex-col items-center rounded-xl bg-slate-100 p-6 text-center shadow-lg dark:bg-slate-900"
				>
					<h1
						class="flex items-center gap-2 text-2xl font-semibold text-black dark:text-white sm:text-4xl"
					>
						Welcome to Bonfire!
					</h1>

					<h2
						class="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text py-1 text-center text-2xl font-bold leading-none tracking-tighter text-transparent sm:text-left sm:text-4xl"
					>
						<Gift class="h-6 w-6" /> You get 3 free logs!
					</h2>
					<p class="mt-3 text-gray-800 dark:text-gray-200">
						Use logs to host bonfires—your first 3 are on us!
					</p>
					<p>(1 log = 1 bonfire event)</p>

					<Button
						id="agree-to-free-logs-btn"
						class="mt-6 flex w-full items-center justify-center gap-2"
						onclick={claimLogs}
					>
						<PartyPopper class="h-5 w-5" /> Continue
					</Button>
					<p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
						Need more? Get them in your profile.
					</p>
				</div>
			</FadeIn>
		</div>
	</div>
</div>

<style>
	.center-screen {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		text-align: center;
	}
</style>
