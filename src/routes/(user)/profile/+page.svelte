<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ProfilePicUploader from '$lib/components/ProfilePicUploader.svelte';
	import { onMount } from 'svelte';
	import { waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	let userId = $state('');

	const full_image_url = $page.data.full_image_url;
	const small_image_url = $page.data.small_image_url;

	onMount(() => {
		const initEvents = async () => {
			userId = (await waitForUserId()) as string;
		};

		initEvents().catch((error) => {
			console.error('Failed to get events:', error);
		});
	});
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<!-- History of thoughts and moods -->
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="my-6 text-2xl font-semibold">Profile</h2>
		<div class="flex flex-col w-full items-center justify-center">
			<Avatar.Root class="h-24 w-24 sm:h-32 sm:w-32">
				<Avatar.Image src={full_image_url} alt="@shadcn" />
				<Avatar.Fallback>CN</Avatar.Fallback>
			</Avatar.Root>
			<a href="profile/upload-profile-image"> <Button variant="link">Edit Avatar</Button></a>
		</div>

		<div class="flex flex-col justify-center space-y-3 mt-10">
			<Button href="profile/username">Update username</Button>
		</div>
	</section>
</div>
