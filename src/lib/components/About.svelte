<script>
	import { onMount } from 'svelte';
	import Container from './Container.svelte';

	onMount(() => {
		document.addEventListener('DOMContentLoaded', () => {
			document.querySelectorAll('.shape').forEach((shape) => {
				const randomDuration = (Math.random() * 8 + 12).toFixed(2); // 12s - 20s
				const randomDelay = (Math.random() * 5).toFixed(2); // 0s - 5s

				// Generate random border-radius values for each shape
				const randomBorder = () => `${Math.floor(Math.random() * 50) + 30}%`;

				// Apply random properties
				shape.style.animationDuration = `${randomDuration}s`;
				shape.style.animationDelay = `${randomDelay}s`;

				// Random starting shape
				shape.style.borderRadius = `${randomBorder()} ${randomBorder()} ${randomBorder()} ${randomBorder()} / ${randomBorder()} ${randomBorder()} ${randomBorder()} ${randomBorder()}`;

				// Override the @keyframes to morph into another random shape
				setTimeout(() => {
					shape.style.borderRadius = `${randomBorder()} ${randomBorder()} ${randomBorder()} ${randomBorder()} / ${randomBorder()} ${randomBorder()} ${randomBorder()} ${randomBorder()}`;
				}, 100); // Delay ensures the browser registers a transition
			});
		});
	});
</script>

{#snippet about2()}
	<div class="text-xl font-bold sm:text-3xl">Focus on your friends, we'll handle the rest</div>
	<p>
		Easily create, share, and manage events with Bonfire. Post updates, track RSVPs, and stay
		connected—so you can focus on what truly matters: your friends.
	</p>
{/snippet}

<Container>
	<div id="about" class="">
		<div class="mx-auto px-6 lg:px-8">
			<div class="my-5 flex flex-col items-center sm:flex-row">
				<div class="w-full space-y-3 sm:w-1/2">
					<div class="text-xl font-bold sm:text-3xl">Create & Share Unforgettable Events</div>
					<p>
						Bonfire goes beyond planning—it helps you capture & share memories. Guests can upload
						moments into a shared group gallery, so you can relive the best parts together.
					</p>
				</div>

				<img
					class="shape mx-15 my-4 aspect-square max-h-[300px] w-full rounded-full border-4 border-blue-300 object-cover dark:border-blue-200 sm:mx-10 sm:my-0 sm:w-1/2"
					srcset="
    https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-sm.jpg 1000w, 
    https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-md.jpg 2000w,
    https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-lg.jpg 3000w"
					src="https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-lg.jpg"
					alt="Paper cups"
				/>
			</div>
			<div class="my-5 sm:my-15 flex flex-col items-center sm:flex-row">
				<div class="block w-full space-y-3 sm:hidden">
					{@render about2()}
				</div>
				<img
					class="shape mx-15 darkborder-white my-4 aspect-square max-h-[300px] w-full rounded-full border-4 border-orange-500 object-cover dark:border-orange-200 sm:mx-10 sm:my-0 sm:w-1/2"
					srcset="
    https://f002.backblazeb2.com/file/bonfire-public/website-public/party-unsplash-sm.jpg 1000w, 
    https://f002.backblazeb2.com/file/bonfire-public/website-public/party-unsplash-md.jpg 2000w,
    https://f002.backblazeb2.com/file/bonfire-public/website-public/party-unsplash-lg.jpg 3000w"
					src="https://f002.backblazeb2.com/file/bonfire-public/website-public/party-unsplash-lg.jpg"
					alt="Marriage"
				/>
				<div class="hidden w-full space-y-7 sm:block sm:w-1/2">
					{@render about2()}
				</div>
			</div>
			<!-- <div class="my-20 flex flex-col sm:flex-row">
				<div class="space-y-7">
					<div class="text-xl sm:text-3xl">Feel good about supporting a cause</div>
					<p>
						At Bonfire, we believe in giving back to the community and supporting causes that
						matter. When you optionally purchase additional Logs to host more Bonfires, you're not
						just supporting the app - you're also supporting a cause of your choice. Whether you
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
			</div> -->
		</div>
	</div>
</Container>

<style>
	.shape {
		background: linear-gradient(75deg, var(--primary) 0%, var(--secondary) 100%);
		animation: morph 14s ease-in-out infinite;
		border-radius: 30% 50% 70% 70% / 30% 60% 90% 20%;
		height: 400px;
		transition: all 2s ease-in-out;
		width: 400px;
		z-index: 5;
	}

	/* Make nth-child elements have different durations and borders */
	.shape:nth-child(odd) {
		animation-duration: 16s;
		border-radius: 50% 50% 40% 60% / 50% 60% 50% 40%;
	}

	.shape:nth-child(even) {
		animation-duration: 18s;
		border-radius: 40% 60% 50% 50% / 60% 40% 60% 40%;
	}

	/* Keyframes for morphing effect */
	@keyframes morph {
		0% {
			border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
			background: linear-gradient(45deg, var(--primary) 0%, var(--secondary) 100%);
		}
		50% {
			border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
			background: linear-gradient(45deg, var(--third) 0%, var(--secondary) 100%);
		}
		100% {
			border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
			background: linear-gradient(45deg, var(--primary) 0%, var(--secondary) 100%);
		}
	}
</style>
