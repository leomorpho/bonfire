<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ProfilePicUploader from '$lib/components/ProfilePicUploader.svelte';
	import { onMount } from 'svelte';
	import { waitForUserId } from '$lib/triplit';

	let userId = $state('');

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
		<div class="mb-8"><ProfilePicUploader /></div>
		<div class="flex flex-col justify-center space-y-3">
			<Button href="profile/username">Update username</Button>
		</div>
	</section>
</div>
