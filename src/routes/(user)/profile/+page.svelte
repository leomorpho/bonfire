<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { feTriplitClient, waitForUserId } from '$lib/triplit';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { useQuery } from '@triplit/svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { Pencil } from 'lucide-svelte';

	let userId = $state('');
	let user = $state();
	let client = feTriplitClient as TriplitClient;

	const full_image_url = $page.data.full_image_url;
	const small_image_url = $page.data.small_image_url;

	onMount(() => {
		user = useQuery(client, client.query('user').where(['id', '=', $page.data.user.id]));
	});
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<!-- History of thoughts and moods -->
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="my-6 text-2xl font-semibold">Profile</h2>
		<div class="flex w-full flex-col items-center justify-center">
			<Avatar.Root class="h-24 w-24 sm:h-32 sm:w-32">
				<Avatar.Image src={full_image_url} alt="@shadcn" />
				<Avatar.Fallback>CN</Avatar.Fallback>
			</Avatar.Root>
			<a href="profile/upload-profile-image"> <Button variant="link">Edit Avatar</Button></a>
		</div>

		{#if !user || user.fetching}
			<!-- <Loader /> -->
		{:else if user.error}
			<p>Error: {user.error.message}</p>
		{:else if user.results}
			<div class="mt-10 flex items-center justify-center text-xl font-semibold">
				{user.results[0].username}
				<a href="profile/username"
					><div
						class="ml-1 flex items-center justify-center p-1 hover:rounded-lg hover:bg-slate-200"
					>
						<Pencil class="ml-1 h-4 w-4 " />
					</div></a
				>
			</div>
		{/if}
	</section>
</div>
