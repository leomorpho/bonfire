<script>
	import Container from '../Container.svelte';
	import Bonfire from '../main-bonfire-event/Bonfire.svelte';
	import Button from '../ui/button/button.svelte';
</script>

<!-- The exact line breaks and widths of various sections should depend on the copy. Make sure the copy looks good on
all screen sizes (not the case here) -->
<Container>
	<div class="flex flex-col py-8 sm:py-20 md:flex-row">
		<div>
			<div
				class="pointer-events-none z-10 whitespace-pre-wrap bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text py-1 text-center text-5xl font-bold leading-none tracking-tighter text-transparent sm:mt-8 sm:text-left sm:text-7xl"
			>
				Re-ignite <br /> your social life<br /> right
				<span class="underline decoration-purple-500">here</span>
			</div>
			<p class="text-md mb-6 mt-2 text-center sm:mb-8 sm:mt-4 sm:text-left sm:text-lg">
				Host and share memorable events with your friends.
			</p>
			<div class="flex items-center justify-center sm:justify-start">
				<a href="/">
					<Button class="h-14 bg-purple-500 text-lg">Start a Bonfire</Button>
				</a>
				<div class="mx-3 italic">it's free!</div>
			</div>
		</div>
		<div class=" mt-8 flex-1 rounded-xl bg-gray-100 p-10 text-center text-xl md:ml-5">
			Put a quick demo video of the product, a carousel of images, some testimonials or relevant
			logos.
		</div>
		<Bonfire />
	</div>
</Container>
