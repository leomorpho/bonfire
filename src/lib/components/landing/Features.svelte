<script lang="ts">
	import {
		BellRing,
		Feather,
		Flame,
		Images,
		Link,
		MessageCircle,
		ShoppingBasket,
		Users
	} from 'lucide-svelte';
	import Container from '../Container.svelte';
	import Title from './feature/Title.svelte';
	import Feature from './feature/Feature.svelte';
</script>

{#snippet feature()}{/snippet}

<Container>
	<div class="py-5 md:py-7"></div>
	<h2 class="mb-10 text-center text-2xl font-bold md:text-4xl">App Features</h2>
	<div class="flex w-full justify-center">
		<div class="grid max-w-[80vw] grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🙌</div>
					Create Event in Seconds</Title
				>
				<p class="text-center text-base">
					Set up an event instantly. Choose a fun theme and upload your own theme image.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">💨</div>
					Quick-share URLs</Title
				>
				<p class="text-center text-base">
					Each Bonfire has a unique shareable link. Keep it private or spread it far.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🤸</div>
					Track & Notify Attendees</Title
				>
				<p class="text-center text-base">
					See who's coming, send updates, and let guests upload event photos.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">📷</div>
					Log Memories</Title
				>
				<p class="text-center text-base">
					Share all event photos and videos in one place where users can download them.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🔔</div>
					Auto-reminders</Title
				>
				<p class="text-center text-base">Automatic reminders keep attendees in the loop.</p>
			</Feature>
			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🙊</div>
					Ephemeral and Secret</Title
				>
				<p class="text-center text-base">
					Bonfires auto-delete in 14 days, but you'll get a heads-up. Only those with the link can
					access.
				</p>
			</Feature>

			<Feature>
				<Title
					>
					<div class="mr-3 text-2xl sm:text-3xl">💬</div>
					Real-time Messaging</Title
				>
				<p class="text-center text-base">Chat live to plan, update, and share moments.</p>
			</Feature>
			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🥑</div>
					Bring List</Title
				>
				<p class="text-center text-base">
					Guests can claim items to bring, ensuring nothing is forgotten.
				</p>
			</Feature>
		</div>
	</div>
</Container>
