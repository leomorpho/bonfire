<script lang="ts">
	import { X, Heart } from 'lucide-svelte';
	import { Button } from '../ui/button';
</script>

<div
	class="animate-fadeIn relative mx-auto mt-4 flex max-w-lg items-center justify-between rounded-lg border-l-4 border-green-600 bg-green-50 p-4 shadow-md transition-opacity dark:border-green-400 dark:bg-green-900 dark:text-white"
>
	<div class="flex items-start space-x-3">
		<Heart class="h-6 w-6 text-green-600 dark:text-green-300" />

		<div>
			<p class="font-semibold text-green-800 dark:text-green-200">
				Choose a Cause & Make an Impact  <span class="mx-1">🌍</span>
			</p>
			<p class="text-sm text-green-700 dark:text-green-300">
				We donate <strong>25% of our profits</strong> to charity. Your choice matters! Select a cause
				now, and we’ll allocate funds based on what our amazing users support.
			</p>
		</div>
	</div>

	<div class="flex space-x-2">
		<a href="/profile/non-profits">
			<Button
				class="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-400"
			>
				Select Cause
			</Button>
		</a>
	</div>
</div>

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
