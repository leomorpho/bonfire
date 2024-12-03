<script>
	import { Ship } from 'lucide-svelte';
	import Container from './Container.svelte';
	import Button from './ui/button/button.svelte';
</script>

<!-- The exact line breaks and widths of various sections should depend on the copy. Make sure the copy looks good on
all screen sizes (not the case here) -->
<Container>
	<div class="flex flex-col py-8 sm:py-20 md:flex-row">
		<div>
			<div class="text-center text-4xl font-bold sm:mt-8 sm:text-left sm:text-7xl">
				Re-ignite your <br /> <span class="text-pink-500">social life</span> <br /> right
				<span class="underline decoration-purple-500">here</span>
			</div>
			<p class="text-md mb-6 mt-2 text-center sm:mb-8 sm:mt-4 sm:text-left sm:text-lg">
				Host and share memorable events with your friends.
			</p>
			<div class="flex items-center justify-center sm:justify-start">
				<a href="/" > 
					<Button class="h-14 text-lg bg-purple-500">Start a Bonfire</Button>
					 </a>
				<div class="italic mx-3">it's free!</div>
			</div>
		</div>
		<div class=" mt-8 flex-1 rounded-xl bg-gray-100 p-10 text-center text-xl md:ml-5">
			Put a quick demo video of the product, a carousel of
			images, some testimonials or relevant logos. 
		</div>
	</div>
</Container>
