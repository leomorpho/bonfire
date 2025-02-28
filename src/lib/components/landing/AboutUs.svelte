<script lang="ts">
	import Container from '../Container.svelte';
	import { Image } from '@unpic/svelte';
</script>

<Container>
	<div id="about-us" class="">
		<div class="mx-auto max-w-2xl px-6 lg:px-8">
			<h2 class="mb-16 text-center text-2xl font-bold md:text-4xl">We are Bonfire</h2>
			<div class="my-20 flex flex-col sm:flex-row">
				<!-- <Image
					class="rounded-lg"
					height={200}
					src=""
					layout="constrained"
					aspectRatio={5 / 3}
					alt="TODO"
				/> -->
				<div class="space-y-7">
					<p>
						We are a small, independent team made up of passionate developers and creators who are
						committed to bringing the warmth and connection of a real bonfire to your private
						events. We take pride in our work and strive to provide you with top-notch support and
						service.
					</p>
					<p>
						As a small team, we rely on the support of our users to keep the app running and to
						continue improving our platform. If you love what we do and want to help us keep the
						bonfire burning, please consider making a donation to support our team. Every little bit
						helps and we are incredibly grateful for your support.
					</p>
				</div>
			</div>
		</div>
	</div>
</Container>
