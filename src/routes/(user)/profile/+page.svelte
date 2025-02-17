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
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';

	let user = $state();
	let client: TriplitClient;

	const full_image_url = $page.data.full_image_url;
	console.log(full_image_url);
	const small_image_url = $page.data.small_image_url;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		user = useQuery(client, client.query('user').where(['id', '=', $page.data.user.id]));
		console.log('$page.data.user', $page.data.user);
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
				<ProfileAvatar
					url={small_image_url}
					fullsizeUrl={full_image_url}
					fallbackName={user.results[0].username}
					username={user.results[0].username}
					baseHeightPx={120}
				/>
				<a href="profile/upload-profile-image"> <Button variant="link">Edit Avatar</Button></a>
			</div>
			<div class="mt-10 flex items-center justify-center text-xl font-semibold">
				<a
					href="profile/username"
					class={`flex ${user.results[0].username ? '' : 'rounded-lg bg-yellow-200 p-2 hover:bg-yellow-100 dark:bg-yellow-700 dark:hover:bg-yellow-600'}`}
				>
					{user.results[0].username ? user.results[0].username : 'Set your username'}
					<div
						class="ml-1 flex items-center justify-center p-1 hover:rounded-lg hover:bg-slate-200"
					>
						<Pencil class="ml-1 h-4 w-4 " />
					</div></a
				>
			</div>
			<div class="my-2">{$page.data.user.email}</div>
			<!-- <div class="my-2 mt-5">You have {$page.data.user.num_logs} logs remaining</div>
			<Button class="my-2"><Plus />Add more logs</Button> -->
			<!-- <Button class="my-2">Log out</Button> -->
		{/if}
	</section>
</div>
