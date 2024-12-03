<script>
	import Container from './Container.svelte';
	import { Image } from '@unpic/svelte';
</script>

<Container>
	<div id="about" class="">
		<div class="mx-auto max-w-2xl px-6 lg:px-8">
			<div class="flex flex-col sm:flex-row my-20">
				<div class="space-y-7">
					<div class="text-xl sm:text-3xl">Create and share unforgettable events</div>
					<p>
						Bonfire isn't just about planning events - it's about creating unforgettable experiences
						that bring people together. Now your guests can share and store all the moments they've
						captured into one group gallery, so you can truly relive the memories that make your
						event special.
					</p>
				</div>
				<Image
					class="rounded-lg"
					height={200}
					src=""
					layout="constrained"
					aspectRatio={5 / 3}
					alt="TODO"
				/>
			</div>
			<div class="flex flex-col sm:flex-row my-20">
				<Image
					class="rounded-lg"
					height={200}
					src=""
					layout="constrained"
					aspectRatio={5 / 3}
					alt="TODO"
				/>
				<div class="space-y-7">
					<div class="text-xl sm:text-3xl">Focus on your friends, we'll handle the rest</div>
					<p>
						With Bonfire, you can easily create and share personalized events that reflect your
						unique style and interests. With posting announcements and tracking RSVPs, Bonfire makes
						it easy to stay connected and informed about all the details of your event. So you can
						focus on what really matters - spending quality time with the people you care about
						most.
					</p>
				</div>
			</div>
			<div class="flex flex-col sm:flex-row my-20">
				<div class="space-y-7">
					<div class="text-xl sm:text-3xl">Feel good about supporting a cause</div>
					<p>
						At Bonfire, we believe in giving back to the community and supporting causes that
						matter. When you optionally purchase additional Logs to host more Bonfires, you're
						not just supporting the app - you're also supporting a cause of your choice. Whether you
						want to plant trees, donate to a charity, or contribute to an environmental cause, your
						contribution can make a real difference.
					</p>
				</div>
				<Image
					class="rounded-lg"
					height={200}
					src=""
					layout="constrained"
					aspectRatio={5 / 3}
					alt="TODO"
				/>
			</div>
		</div>
	</div>
</Container>
