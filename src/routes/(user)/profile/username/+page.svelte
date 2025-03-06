<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { redirectToTempAttendanceInBonfireIfAvailable } from '$lib/utils';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';

	let username = $state('');
	let submitEnabled = $state(false);
	let userExists = $state(false);
	let userIsFullyOnboarded = $state(false);

	$effect(() => {
		if (username.length > 0 && userExists) {
			submitEnabled = true;
		} else {
			submitEnabled = false;
		}
		console.log('username:', username, 'userExists:', userExists);
		console.log('submitEnabled:', submitEnabled);
	});

	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		console.log('user with id', $page.data.user.id);

		// NOTE: we need to subscribe because if the user is new, they may still be in the creating
		// process and we can't update a username on a user who doesn't yet exist.
		const unsubscribeFromUserQuery = client.subscribe(
			client
				.query('user')
				.where(['id', '=', $page.data.user.id])
				.select(['id', 'username', 'is_fully_onboarded'])
				.build(),
			(results) => {
				// If there are less than 3 files in the events eventFiles, fetch the latest 3
				if (results.length == 1) {
					userExists = true;
					if (results[0].username.length > 0) {
						username = results[0].username;
					}
					if (results[0].is_fully_onboarded) {
						userIsFullyOnboarded = true;
					}
					console.log('userIsFullyOnboarded', userIsFullyOnboarded, results[0]);
				}
			},
			(error) => {
				console.error('Error fetching username:', error);
			}
		);

		return () => {
			// Cleanup
			unsubscribeFromUserQuery();
		};
	});

	const handleSubmit = async (e: Event) => {
		const userId = (await waitForUserId()) as string;

		await client.update('user', userId, async (entity) => {
			entity.username = username;
			entity.updated_at = new Date();
		});

		// If user is not onboarded, redirect to onboarding flow
		if (!userIsFullyOnboarded) {

			goto('/onboarding');
			return;
		}
		goto('/dashboard');

		const tempAttendanceUrl = await redirectToTempAttendanceInBonfireIfAvailable();
		if (tempAttendanceUrl) {
			goto(tempAttendanceUrl);
		}
	};
</script>

<div class="p-safe flex min-h-screen items-center justify-center dark:text-white">
	<form class="m-2 w-full max-w-md space-y-4 text-center" onsubmit={handleSubmit}>
		<div class="text-lg font-semibold">Choose Your Username</div>

		<Input
			bind:value={username}
			type="text"
			placeholder="Charlotte Brönte"
			class="my-5 w-full dark:bg-slate-700"
		/>

		<div class="text-sm text-yellow-600 dark:text-yellow-200">
			This is how friends will recognize you. It's required to attend any bonfire.
		</div>
		<Button type="submit" disabled={!submitEnabled} class="w-full">Save</Button>
	</form>
</div>
