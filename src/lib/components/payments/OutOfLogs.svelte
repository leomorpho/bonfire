<script lang="ts">
	import { X } from 'lucide-svelte';
	import { Button } from '../ui/button';

	let showWarning = $state(true);

	function closeWarning() {
		showWarning = false;
	}
</script>

{#if showWarning}
	<div
		class="animate-fadeIn relative mx-auto mt-4 flex max-w-lg items-center justify-between rounded-lg border-l-4 border-red-500 bg-red-100 p-4 shadow-md transition-opacity dark:border-red-400 dark:bg-red-900 dark:text-white"
	>
		<div class="flex items-center space-x-3">
			<svg
				class="h-6 w-6 text-red-600 dark:text-red-300"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10.29 3.86L1.82 20.14A2 2 0 003.67 23h16.66a2 2 0 001.85-2.86L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"
				/>
			</svg>
			<div>
				<p class="font-semibold text-red-800 dark:text-red-200">You're out of logs!</p>
				<p class="text-sm text-red-600 dark:text-red-300">
					You need more logs to allow RSVPs for your event.
				</p>
			</div>
		</div>

		<div class="flex space-x-2">
			<a href="/profile/bonfire-logs"
				><button
					class="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400"
				>
					Buy More Logs
				</button>
			</a>
			<div class="flex h-max items-center">
				<Button
					onclick={closeWarning}
					class="h-full  rounded bg-opacity-0 p-1 text-red-600 shadow-none transition hover:bg-red-200 focus:outline-none dark:text-red-300 dark:hover:bg-red-700"
				>
					<X />
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out;
	}
</style>
