<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { feTriplitClient, waitForUserId } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';

	let username = $state('');
	let submitEnabled = $state(false);

	$effect(() => {
		if (username.length > 0) {
			submitEnabled = true;
		} else {
			submitEnabled = false;
		}
	});
	let client = feTriplitClient as TriplitClient;

	const handleSubmit = async (e: Event) => {
		const userId = (await waitForUserId()) as string;

		await client.update('user', userId, async (entity) => {
			entity.username = username;
		});

		goto("/dashboard")
	};
</script>

<div class="p-safe flex min-h-screen items-center justify-center bg-gray-100">
	<form class="m-2 w-full max-w-md space-y-4 text-center" onsubmit={handleSubmit}>
		<div class="text-lg font-semibold">Choose Your Username</div>

		<Input bind:value={username} type="text" placeholder="Charlotte Brönte" class="my-5 w-full" />

		<div class="text-sm text-gray-600">This is how friends will recognize you.</div>
		<Button type="submit" disabled={!submitEnabled} class="w-full">Save</Button>
	</form>
</div>
