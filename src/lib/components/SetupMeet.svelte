<script lang="ts">
	import { addDays } from 'date-fns';
	import { onMount } from 'svelte';
	import { X } from 'lucide-svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';
	import { Button } from '$lib/jsrepo/ui/button';

	const numHideDaysAfterDismissed = 30;

	let { userId = null } = $props();

	let userDataPersonalData = $state();
	let isLoading = $state(true);

	let show = $state(false);

	onMount(() => {
		const init = async () => {
			if (!userId) return;
			const currentDate = new Date();

			const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
			userDataPersonalData = await client.fetchOne(
				client.query('user_personal_data').Where(['user_id', '=', userId])
			);

			const dismissedTimestamp = userDataPersonalData?.lastDismissedMeetOnboarding;

			if (!dismissedTimestamp) {
				show = true;
			} else {
				const dismissedDate = new Date(dismissedTimestamp);
				if (currentDate.getTime() < addDays(dismissedDate, numHideDaysAfterDismissed).getTime()) {
					show = false;
				} else {
					show = true;
				}
			}
			isLoading = false;
		};
		console.log('initting');
		init();
	});

	const dismissAlert = async () => {
		console.log('isLoading', isLoading);
		if (isLoading) return;

		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		console.log('--->');
		if (userDataPersonalData) {
			await client.update('user_personal_data', userDataPersonalData?.id, async (e) => {
				e.lastDismissedMeetOnboarding = new Date();
			});
		} else {
			await client.insert('user_personal_data', {
				user_id: userId,
				lastDismissedMeetOnboarding: new Date()
			});
		}

		show = false;
	};
</script>

{#if show}
	<div
		id="success-alert"
		class="mb-4 flex flex-col items-center rounded-2xl bg-slate-200 p-4 text-sm text-green-800 dark:bg-gray-700 dark:text-green-400"
		role="alert"
	>
		<div class="mb-2 flex w-full items-center justify-between">
			<svg
				class="me-3 inline h-4 w-4 shrink-0 text-black"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="currentColor"
				viewBox="0 0 20 20"
			>
				<path
					d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
				/>
			</svg>
			<button
				type="button"
				class="-mx-1.5 -my-1.5 ms-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 p-1 text-red-500 hover:bg-red-200 focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-green-400 dark:hover:bg-gray-700 dark:hover:dark:bg-gray-600"
				onclick={dismissAlert}
				aria-label="Close"
			>
				<span class="sr-only">Close</span>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>
		</div>
		<div class="w-full text-center text-sm">
			<div
				class="flex flex-col space-y-4 text-black dark:text-white md:flex-row md:space-x-2 md:space-y-0"
			>
				<!-- Step 1 Card -->
				<div class="step-card bg-bonfireGreen-200 dark:bg-bonfireGreen-600/90 rounded-xl p-4 shadow-md">
					<h3 class="text-lg font-bold">1. Take our quick personality test 📝</h3>
					<p>Complete our personality and self questionnaire to help us understand you better.</p>
				</div>
				<!-- Step 2 Card -->
				<div class="step-card bg-bonfirePurple-200 dark:bg-bonfirePurple-600/90 rounded-xl p-4 shadow-md">
					<h3 class="text-lg font-bold">2. We match you 🕯</h3>
					<p>Our AI algorithm matches you with like-minded individuals for a great experience.</p>
				</div>
				<!-- Step 3 Card -->
				<div class="step-card bg-bonfireOrange-300 dark:bg-bonfireOrange-700/90 rounded-xl p-4 shadow-md">
					<h3 class="text-lg font-bold">3. Meet new friends 👥</h3>
					<p>Join events and meet strangers who could become your new best friends.</p>
				</div>
				<div class="step-card bg-bonfireRed-300 dark:bg-bonfireRed-600/90 rounded-xl p-4 shadow-md">
					<h3 class="text-lg font-bold">4. Give feedback 👍</h3>
					<p>Give us feedback and share a picture of your event to earn free credits!</p>
				</div>
			</div>
			<Button
				href="/meet/questionnaire"
				class="mt-4 rounded-xl bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
			>
				Book a seat!
			</Button>
		</div>
	</div>
{/if}
