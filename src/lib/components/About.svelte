<script>
	import Container from './Container.svelte';
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
					class="shape-1 mx-15 my-4 aspect-square max-h-[300px] w-full rounded-full border-4 border-blue-300 object-cover dark:border-blue-200 sm:mx-10 sm:my-0 sm:w-1/2"
					srcset="
    https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-sm.jpg 1000w, 
    https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-md.jpg 2000w,
    https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-lg.jpg 3000w"
					src="https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-lg.jpg"
					alt="Paper cups"
				/>
			</div>
			<div class="sm:my-15 my-5 flex flex-col items-center sm:flex-row">
				<div class="block w-full space-y-3 sm:hidden">
					{@render about2()}
				</div>
				<img
					class="shape-2 mx-15 darkborder-white my-4 aspect-square max-h-[300px] w-full rounded-full border-4 border-orange-500 object-cover dark:border-orange-200 sm:mx-10 sm:my-0 sm:w-1/2"
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
			<div class="my-5 flex flex-col items-center sm:flex-row">
				<div class="w-full space-y-3 sm:w-1/2">
					<div class="text-xl font-bold sm:text-3xl">Feel good about supporting a cause</div>
					<p>
						At Bonfire, 25% of our profits support top-rated charities. Choose a cause you care
						about—plant trees, donate, or support environmental efforts—your contribution makes an
						impact.
					</p>
				</div>

				<img
					class="shape-1 mx-15 my-4 aspect-square max-h-[300px] w-full rounded-full border-4 border-purple-300 object-cover dark:border-purple-200 sm:mx-10 sm:my-0 sm:w-1/2"
					srcset="
    https://f002.backblazeb2.com/file/bonfire-public/website-public/non-profit-sm.jpeg 1000w, 
    https://f002.backblazeb2.com/file/bonfire-public/website-public/non-profit-md.jpeg 2000w,
    https://f002.backblazeb2.com/file/bonfire-public/website-public/non-profit-lg.jpeg 3000w"
					src="https://f002.backblazeb2.com/file/bonfire-public/website-public/non-profit-lg.jpeg"
					alt="Non-profits"
				/>
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
	.shape-1 {
		background: linear-gradient(75deg, var(--primary) 0%, var(--secondary) 100%);
		animation: morph-1 18s ease-in-out infinite;
		border-radius: 30% 50% 70% 70% / 40% 60% 90% 40%;
		height: 400px;
		transition: all 2s ease-in-out;
		width: 400px;
		z-index: 5;
	}

	.shape-2 {
		background: linear-gradient(75deg, var(--primary) 0%, var(--secondary) 100%);
		animation: morph-2 18s ease-in-out infinite;
		border-radius: 40% 60% 50% 50% / 60% 40% 60% 40%;
		height: 400px;
		transition: all 2s ease-in-out;
		width: 400px;
		z-index: 5;
	}

	/* Keyframes for morphing effect */
	@keyframes morph-1 {
		0% {
			border-radius: 60% 40% 40% 70% / 60% 30% 70% 40%;
			background: linear-gradient(45deg, var(--primary) 0%, var(--secondary) 100%);
		}
		50% {
			border-radius: 30% 60% 70% 40% / 50% 60% 40% 60%;
			background: linear-gradient(45deg, var(--third) 0%, var(--secondary) 100%);
		}
		100% {
			border-radius: 60% 40% 40% 70% / 60% 30% 70% 40%;
			background: linear-gradient(45deg, var(--primary) 0%, var(--secondary) 100%);
		}
	}

	@keyframes morph-2 {
		0% {
			border-radius: 40% 60% 50% 50% / 60% 40% 60% 40%;
			background: linear-gradient(45deg, var(--secondary) 0%, var(--primary) 100%);
		}
		50% {
			border-radius: 50% 40% 60% 70% / 40% 70% 40% 50%;
			background: linear-gradient(45deg, var(--third) 0%, var(--primary) 100%);
		}
		100% {
			border-radius: 40% 60% 50% 50% / 60% 40% 60% 40%;
			background: linear-gradient(45deg, var(--secondary) 0%, var(--primary) 100%);
		}
	}
</style>
