<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { UsersRound, FlameKindling, HeartHandshake, Pencil, Plus } from 'lucide-svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import ProfileAvatar from '$lib/components/profile/profile-avatar/ProfileAvatar.svelte';
	import SvgLoader from '$lib/components/SvgLoader.svelte';
	import { addUserRequest } from '$lib/profilestore';
	import FadeIn from '$lib/components/containers/FadeIn.svelte';
	import Alert from '$lib/components/Alert.svelte';

	let user = $state();
	let isUserDataLoading = $state(true);
	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserQuery = client.subscribe(
			client
				.query('user')
				.Include('user_personal_data')
				.Include('profile_image')
				// .Include('user_log_tokens')
				.Where(['id', '=', $page.data.user.id]),
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

<FadeIn>
	<div class="mx-2 mb-10 flex flex-col items-center justify-center">
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
							class="ml-2 flex items-center justify-center rounded-full bg-slate-200 p-2 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
						>
							<Pencil class="h-4 w-4" />
						</div></a
					>
				</div>
				<div class="my-2">{$page.data.user.email}</div>

				<Alert
					expireAfterDays={120}
					dismissalKey="your-profile-is-only-visible-to-others-who-shared-a-bonfire-with-you"
					message={'Your profile is private, visible only to those sharing an event with you.'}
				/>

				<div
					class="mt-5 space-y-3 flex flex-col justify-center rounded-xl bg-gradient-to-r from-blue-100 to-blue-300 p-5 text-base dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-800"
				>
					<div class="flex w-full justify-center text-lg">Bonfire Meet Questionnaire</div>
					<div class="text-center text-sm">
						Discover curated events tailored just for you! Our AI matcher connects you with
						like-minded individuals in your city. Dive into new experiences and turn strangers into
						lifelong friends.
					</div>
					{#if isUserDataLoading}
						<div class="flex w-full justify-center"><SvgLoader /></div>
					{:else}
						<Button href="/meet/questionnaire" class={`my-2 flex w-full justify-between ${user.user_personal_data?.meetQuestionnaire?'':'bg-purple-500 hover:bg-purple-400 text-white'}`}>
							<UsersRound />
							{#if user.user_personal_data?.meetQuestionnaire}
								Update preferences
							{:else}
								Setup
							{/if}
							<span></span>
						</Button>
					{/if}
				</div>

				<!-- <div
					class="text-base mt-5 flex flex-col justify-center rounded-xl bg-gradient-to-r from-blue-100 to-blue-300 p-5 dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-800"
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
				</div> -->
			{/if}
		</section>
	</div>
</FadeIn>
