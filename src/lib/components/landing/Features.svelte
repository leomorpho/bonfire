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
	<h2 class="mb-10 text-center text-3xl font-bold md:text-4xl">App Features</h2>
	<div class="flex w-full justify-center">
		<div
			class="grid max-w-[80vw] grid-cols-1 justify-center gap-8 justify-self-center sm:grid-cols-2 xl:grid-cols-4"
		>
			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🙌</div>
					Quick Event Setup & Invites
				</Title>
				<p class="text-center text-base">
					Create an event in seconds, pick a theme, upload an image, and share a unique link—private
					or public.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🤸</div>
					Track Attendees & Assign Admins
				</Title>
				<p class="text-center text-base">
					See RSVPs, send updates, assign admins, and manage guests easily.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🥑</div>
					Collaborative Bring List
				</Title>
				<p class="text-center text-base">
					Guests can claim items to bring so nothing gets forgotten.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">📷</div>
					Log & Share Memories
				</Title>
				<p class="text-center text-base">
					Upload event photos/videos in one place for easy sharing and downloads.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🔔</div>
					Reminders & Push Notifications
				</Title>
				<p class="text-center text-base">
					Stay updated with automatic reminders and personalized notifications.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">💬</div>
					Real-time Messaging
				</Title>
				<p class="text-center text-base">
					Chat with attendees to plan, update, and share moments instantly.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">🔒</div>
					Ephemeral & Private Events
				</Title>
				<p class="text-center text-base">
					Only invited guests can access. Events auto-delete 14 days after completion.
				</p>
			</Feature>

			<Feature>
				<Title>
					<div class="mr-3 text-2xl sm:text-3xl">❤️</div>
					Event Capacity & Guest Limits
				</Title>
				<p class="text-center text-base">
					Set a max attendee limit and allow guests to bring plus-ones.
				</p>
			</Feature>
		</div>
	</div>
</Container>
