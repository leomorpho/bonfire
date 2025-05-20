<script lang="ts">
	import Container from '../Container.svelte';
	import Title from './feature/Title.svelte';
	import Feature from './feature/Feature.svelte';

	const styles = `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/ocean.jpg');
    background-repeat: repeat;
    background-size: auto;
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;

   /* Define CSS variables for gradient height */
    --gradient-height: 30%; /* Adjust this value to control the height of the gradient */

    /* Apply a mask to fade the image */
    mask-image:
        linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0)),
        linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0));
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
    mask-position: top, bottom;
    -webkit-mask-image:
        linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0)),
        linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) var(--gradient-height), rgba(0, 0, 0, 1) calc(100% - var(--gradient-height)), rgba(0, 0, 0, 0));
    -webkit-mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: top, bottom;
  `;
</script>

<div style={styles} id="features">
	<div class="bg-slate-100/30 py-16 dark:bg-slate-900/5">
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
							Create an event in seconds, pick a theme, upload an image, and share a unique
							link—private or public.
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
	</div>
</div>
