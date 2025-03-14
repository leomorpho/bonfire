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
</script>

<Container>
	<div class="py-5 md:py-7"></div>
	<h2 class="mb-10 text-center text-2xl font-bold md:text-4xl">App Features</h2>
	<div class="flex w-full justify-center">
		<div class="grid max-w-[80vw] grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
			<div>
				<Title><Flame class="mr-3 h-6 w-6" />Create Event in Seconds</Title>
				<p class="text-base text-center">
					Set up an event instantly. Choose a fun theme and upload your own image.
				</p>
			</div>
			<div>
				<Title><Link class="mr-3 h-6 w-6" />Quick-share URLs</Title>
				<p class="text-base text-center">
					Each Bonfire has a unique shareable link—keep it private or spread it far.
				</p>
			</div>
			<div>
				<Title><Users class="mr-3 h-6 w-6" /> Track & Notify Attendees</Title>
				<p class="text-base text-center">See who's coming, send updates, and let guests upload event photos.</p>
			</div>
			<div>
				<Title><Images class="mr-3 h-6 w-6" /> Log Memories</Title>
				<p class="text-base text-center">
					Share all event photos and videos in one place and let users can download them.
				</p>
			</div>
			<div>
				<Title><BellRing class="mr-3 h-6 w-6" /> Auto-reminders</Title>
				<p class="text-base text-center">Automatic reminders keep attendees in the loop.</p>
			</div>
			<div>
				<Title><Feather class="mr-3 h-6 w-6" /> Ephemeral and Secret</Title>
				<p class="text-base text-center">
					Bonfires auto-delete in 14 days, but you'll get a heads-up. Only those with the link can
					access.
				</p>
			</div>
			<div>
				<Title><MessageCircle class="mr-3 h-6 w-6" /> Real-time Messaging</Title>
				<p class="text-base text-center">Chat live to plan, update, and share moments.</p>
			</div>
			<div>
				<Title><ShoppingBasket class="mr-3 h-6 w-6" /> Bring List</Title>
				<p class="text-base text-center">Guests can claim items to bring, ensuring nothing is forgotten.</p>
			</div>
		</div>
	</div>
</Container>
