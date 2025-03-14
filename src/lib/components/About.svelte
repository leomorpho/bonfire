<script>
	import Container from './Container.svelte';
</script>

<Container>
	<div id="about" class="">
		<div class="mx-auto px-6 lg:px-8">
			<div class="my-5 flex flex-col sm:flex-row items-center">
				<div class="w-full space-y-7 sm:w-1/2">
					<div class="text-xl font-bold sm:text-3xl">Create & Share Unforgettable Events</div>
					<p>
						Bonfire goes beyond planning—it helps you capture & share memories. Guests can upload
						moments into a shared group gallery, so you can relive the best parts together.
					</p>
				</div>

				<img
					class="my-10 sm:my-0 mx-15 aspect-square w-full rounded-full object-cover sm:mx-10 sm:w-1/2 max-h-[300px]"
					srcset="
    https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-sm.jpg 1000w, 
    https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-md.jpg 2000w,
    https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-lg.jpg 3000w"
					src="https://f002.backblazeb2.com/file/bonfire-public/website-public/paper-cups-lg.jpg"
					alt="Paper cups"
				/>
			</div>
			<div class="my-20 flex flex-col sm:flex-row items-center">
				<img
					class="my-10 sm:my-0 mx-15 aspect-square w-full rounded-full object-cover sm:mx-10 sm:w-1/2 max-h-[300px]"
					srcset="
    https://f002.backblazeb2.com/file/bonfire-public/website-public/party-unsplash-sm.jpg 1000w, 
    https://f002.backblazeb2.com/file/bonfire-public/website-public/party-unsplash-md.jpg 2000w,
    https://f002.backblazeb2.com/file/bonfire-public/website-public/party-unsplash-lg.jpg 3000w"
					src="https://f002.backblazeb2.com/file/bonfire-public/website-public/party-unsplash-lg.jpg"
					alt="Marriage"
				/>
				<div class="w-full space-y-7 sm:w-1/2">
					<div class="text-xl font-bold sm:text-3xl">
						Focus on your friends, we'll handle the rest
					</div>
					<p>
						Easily create, share, and manage events with Bonfire. Post updates, track RSVPs, and
						stay connected—so you can focus on what truly matters: your friends.
					</p>
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
