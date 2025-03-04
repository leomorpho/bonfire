<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeftRight, FlameKindling, HeartHandshake, Pencil, Plus } from 'lucide-svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import SvgLoader from '$lib/components/SvgLoader.svelte';
	import { addUserRequest } from '$lib/profilestore';

	let user = $state();
	let isUserDataLoading = $state(true);
	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserQuery = client.subscribe(
			client
				.query('user')
				.include('profile_image')
				.include('user_log_tokens')
				.where(['id', '=', $page.data.user.id])
				.build(),
			(results) => {
				user = results[0];
				console.log('user', user);
				isUserDataLoading = false;

				// if refresh occurs, it's likely due to profile image so we want to retrigger the UI refresh
				addUserRequest($page.data.user.id, true);
			},
			(error) => {
				console.error('Error fetching current temporary attendee:', error);
				isUserDataLoading = false;
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

			<div
				class="mt-5 flex flex-col justify-center rounded-xl bg-gradient-to-r from-blue-100 to-blue-300 p-5 dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-800"
			>
				{#if isUserDataLoading}
					<div class="flex w-full justify-center"><SvgLoader /></div>
				{:else if user.user_log_tokens}
					<div class="my-2 mt-5 flex w-full justify-center">
						You have <span class="mx-1 font-bold">{user.user_log_tokens.num_logs}</span> log{user
							.user_log_tokens.num_logs > 1
							? 's'
							: ''} remaining.
					</div>
				{:else}
					You don't currently have any logs remaining.
				{/if}
				<div class="my-2 flex w-full justify-center">(1 log = host 1 bonfire event)</div>
				<a href="profile/logs/buy" class="my-2"
					><Button class="flex w-full justify-between"
						><FlameKindling />Buy more logs<span></span></Button
					>
				</a>
				<a href="settings/transactions-history" class="my-2"
					><Button class="flex w-full justify-between"
						><ArrowLeftRight />See past transactions<span></span></Button
					></a
				>
				<a href="profile/non-profits" class="my-2"
					><Button class="flex w-full justify-between"
						><HeartHandshake />The non-profit you support<span></span></Button
					></a
				>
			</div>
		{/if}
	</section>
</div>
