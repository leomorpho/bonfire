<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { useQuery } from '@triplit/svelte';
	import { Pencil } from 'lucide-svelte';
	import { Plus } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { getFeTriplitClient } from '$lib/triplit';

	let user = $state();
	let client: TriplitClient;

	const full_image_url = $page.data.full_image_url;
	const small_image_url = $page.data.small_image_url;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		user = useQuery(client, client.query('user').where(['id', '=', $page.data.user.id]));
	});
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<!-- History of thoughts and moods -->
	<section class="mt-8 flex w-full flex-col items-center justify-center sm:w-[450px]">
		<h2 class="my-6 text-2xl font-semibold">My Profile</h2>

		{#if !user || user.fetching}
			<!-- <Loader /> -->
		{:else if user.error}
			<p>Error: {user.error.message}</p>
		{:else if user.results}
			<div class="flex w-full flex-col items-center justify-center">
				<Dialog.Root>
					<Dialog.Trigger
						><Avatar.Root class="h-24 w-24 sm:h-32 sm:w-32">
							<Avatar.Image src={full_image_url} alt="@shadcn" />
							<Avatar.Fallback>{user.results[0].username?.slice(0, 2)}</Avatar.Fallback>
						</Avatar.Root>
					</Dialog.Trigger>
					<Dialog.Content class="flex items-center justify-center">
						<Dialog.Header>
							<Avatar.Root class="h-full w-full ">
								<Avatar.Image src={full_image_url} alt="@shadcn" />
								<Avatar.Fallback>{user.results[0].username?.slice(0, 2)}</Avatar.Fallback>
							</Avatar.Root>
						</Dialog.Header>
					</Dialog.Content>
				</Dialog.Root>
				<a href="profile/upload-profile-image"> <Button variant="link">Edit Avatar</Button></a>
			</div>
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
			<div class="my-2">{$page.data.user.email}</div>
			<div class="my-2 mt-5">You have 2 logs remaining</div>
			<Button class="my-2"><Plus />Add more logs</Button>
			<!-- <Button class="my-2">Log out</Button> -->
		{/if}
	</section>
</div>
