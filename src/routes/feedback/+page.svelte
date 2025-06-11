<script lang="ts">
	import { env as publicEnv } from '$env/dynamic/public';
	import Button from '$lib/components/ui/button/button.svelte';
	import { House } from 'lucide-svelte';
	import Container from '$lib/components/Container.svelte';
	import AboutUs from '$lib/components/landing/AboutUs.svelte';
</script>

<Container>
	<div id="feedback" class="sm:mb-15">
		<div class="mx-auto max-w-2xl px-6 lg:px-8">
			<h2 class="mb-5 text-center text-3xl font-bold md:text-4xl">Share Your Feedback</h2>
			<div class="my-5 flex flex-col text-base">
				<div class="space-y-3 text-center">
					<p>
						Your feedback is incredibly valuable as I work to improve and build a better product.
						Please share your thoughts, suggestions, or any issues you encounter.
					</p>
					<p>
						You can reach me directly at:
						<a
							href="mailto:{publicEnv.PUBLIC_FROM_EMAIL}"
							class="text-blue-600 hover:underline dark:text-blue-400"
							>{publicEnv.PUBLIC_FROM_EMAIL}</a
						>
					</p>
					<p>Thank you for taking the time to help me make this product better!</p>
				</div>
			</div>
		</div>
	</div>
</Container>

<AboutUs class="mt-5" />

<div class="mb-20 flex w-full justify-center">
	<a href="/"><Button class="mt-10"><House /> Go back home</Button></a>
</div>

<style>
	/* Add any additional styles specific to this component here */
</style>
