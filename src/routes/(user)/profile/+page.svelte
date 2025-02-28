<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { FlameKindling, Pencil, Plus } from 'lucide-svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import SvgLoader from '$lib/components/SvgLoader.svelte';
	import { addUserRequest } from '$lib/profilestore';

	let user = $state();
	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserQuery = client.subscribe(
			client.query('user').include('profile_image').where(['id', '=', $page.data.user.id]).build(),
			(results) => {
				user = results[0];

				// if refresh occurs, it's likely due to profile image so we want to retrigger the UI refresh
				addUserRequest($page.data.user.id, true);
			},
			(error) => {
				console.error('Error fetching current temporary attendee:', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);
		console.log('$page.data.user', $page.data.user);

		return () => {
			unsubscribeFromUserQuery();
		};
	});
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<!-- History of thoughts and moods -->
	<section class="mt-8 flex w-full flex-col items-center justify-center sm:w-[450px]">
		<h2 class="my-6 text-2xl font-semibold">My Profile</h2>

		{#if !user}
			<SvgLoader />
		{:else}
			<div class="flex w-full flex-col items-center justify-center">
				<ProfileAvatar userId={user.id} baseHeightPx={120} />
				<a href="profile/upload-profile-image"> <Button variant="link">Edit Avatar</Button></a>
			</div>
			<div class="mt-10 flex items-center justify-center text-xl font-semibold">
				{user.username}
				<a
					href="profile/username"
					class={`flex ${user.username ? '' : 'rounded-lg bg-yellow-200 p-2 hover:bg-yellow-100 dark:bg-yellow-700 dark:hover:bg-yellow-600'}`}
				>
					{user.username ? '' : 'Set your username'}
					<div
						class="ml-2 flex items-center justify-center rounded-full bg-slate-100 p-2 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
					>
						<Pencil class="h-4 w-4" />
					</div></a
				>
			</div>
			<div class="my-2">{$page.data.user.email}</div>

			<a
				href="profile/bonfire-logs"
				class="mt-5 flex flex-col justify-center rounded-xl bg-gradient-to-r from-blue-100 to-blue-300 p-5 dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-800"
			>
				<div class="my-2 mt-5">You have {$page.data.user.num_logs} logs remaining</div>
				<Button class="my-2"><FlameKindling />Add more logs</Button>
			</a>
		{/if}
	</section>
</div>
