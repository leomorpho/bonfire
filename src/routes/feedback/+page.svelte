<script lang="ts">
	import { env as publicEnv } from '$env/dynamic/public';
	import Button from '$lib/components/ui/button/button.svelte';
	import { House } from 'lucide-svelte';
</script>

<div class="flex min-h-screen items-center justify-center text-center">
	<div
		class="m-2 w-5/6 rounded-2xl bg-slate-100 p-4 dark:bg-slate-900 dark:text-white sm:w-2/3 sm:p-7 sm:text-xl md:w-1/3 md:p-10"
	>
		<p class="mb-4 text-2xl font-bold">🚀 Thanks for Checking Out the Beta!</p>
		<p class="mb-4">
			We're a tiny team working hard to build something great. This project is in its early stages,
			and your feedback is <em class="font-semibold">incredibly</em>
			valuable to us.
		</p>
		<p class="mb-4">
			We'd love to hear about your experience – what you like, what you don't, and any suggestions
			you have. Every bit of feedback helps us improve!
		</p>
		<p class="mb-6">
			You can reach us directly at:
			<a
				href="mailto:{publicEnv.PUBLIC_FROM_EMAIL}"
				class="text-blue-600 hover:underline dark:text-blue-400">{publicEnv.PUBLIC_FROM_EMAIL}</a
			>
		</p>
		<p class="text-sm italic">
			We appreciate you taking the time to help us build a better product!
		</p>
		<a href="/"><Button class="mt-10"><House/> Go back home</Button></a>
	</div>
</div>
