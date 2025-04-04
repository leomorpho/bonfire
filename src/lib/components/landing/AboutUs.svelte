<script lang="ts">
	import AuroraText from '../AuroraText.svelte';
	import Container from '../Container.svelte';
	import { Image } from '@unpic/svelte';
</script>

<Container>
	<div id="about-us" class="sm:mb-15">
		<div class="mx-auto max-w-2xl px-6 lg:px-8">
			<h2 class="mb-5 text-center text-3xl font-bold md:text-4xl">Who's behind Bonfire?</h2>
			<div class="my-5 flex flex-col">
				<div class="mb-5 mr-5 flex w-full justify-center">
					<Image
						class="rounded-full"
						height={302}
						width={300}
						aspectRatio={1}
						src="https://f002.backblazeb2.com/file/bonfire-public/website-public/about-us/IMG_3627.jpeg"
						layout="constrained"
						alt="TODO"
					/>
				</div>

				<div class="space-y-7 text-center">
					<p>
						Currently, it's just me (hi, I’m Toby!). This is a labor of
						love—designed to make events more personal, meaningful, and easy to share. I handle
						everything from coding to support, and I'm incredibly grateful to have had help from
						multiple friends on key parts of this journey.
					</p>

					<p>
						My goal with this project is not only to create something special but also to support my
						family. Your contributions make a real difference, helping me sustain this mission and
						continue to grow. If you believe in what I'm doing, please consider donating. Every
						bit truly helps and is deeply appreciated.
					</p>
				</div>
			</div>
		</div>
	</div>
</Container>
