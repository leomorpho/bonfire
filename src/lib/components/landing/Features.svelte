<script lang="ts">
	import { BellRing, Feather, Flame, Images, Link, Users } from 'lucide-svelte';
	import Container from '../Container.svelte';
	import Title from './feature/Title.svelte';
</script>

<Container>
	<div class="py-24 md:py-32"></div>
	<h2 class="mb-16 text-center text-2xl font-bold md:text-4xl">App Features</h2>
	<div class="flex w-full justify-center">
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 max-w-[80vw]">
			<div>
				<Title><Flame class="mr-3 h-6 w-6" />Create Event in Seconds</Title>
				<p class="text-base">Creating an event is quick and simple.</p>
				<p class="text-base">You can select from our many fun themes or upload your own image.</p>
			</div>
			<div>
				<Title><Link class="mr-3 h-6 w-6" />Quick-share URLs</Title>
				<p class="text-base">
					Each Bonfire has a unique URL that can be shared anywhere beyond the app.
				</p>
				<p class="text-base">
					Keep it private by sharing it to your close circle, or watch it grow like wildfire by
					sharing publicly on social media.
				</p>
			</div>
			<div>
				<Title><Users class="mr-3 h-6 w-6" /> Track & Notify Attendees</Title>
				<p class="text-base">
					Track who's coming and keep the hype going by posting updates and content.
				</p>
				<p class="text-base">
					RSVP'd users can upload their own images of the event to the group gallery.
				</p>
			</div>
			<div>
				<Title><Images class="mr-3 h-6 w-6" /> Log Memories</Title>
				<p class="text-base">
					Store all the images from everyone at the event in one place and generate a highlight reel
					of the best moments from the event
				</p>
			</div>
			<div>
				<Title><BellRing class="mr-3 h-6 w-6" /> Auto-reminders</Title>
				<p class="text-base">
					Set automatic reminders for attendees to ensure they don't forget about upcoming events.
				</p>
			</div>
			<div>
				<Title><Feather class="mr-3 h-6 w-6" /> Ephemeral and Secret</Title>
				<p class="text-base">
					All bonfires are deleted 14 days after they start, but don't worry we'll warn you. You can
					back up the uploaded media with a single click download!
				</p>
			</div>
		</div>
	</div>
</Container>
