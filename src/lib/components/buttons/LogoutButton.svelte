<script lang="ts">
	import { LogOut } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import { clearCache, getFeWorkerTriplitClient } from '$lib/triplit';
	import { onMount } from 'svelte';
	import type { TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

    let {cls=null} = $props()

	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
	});
</script>

<form method="post" class={`${cls} flex w-full justify-center`} action={"/login?/signout"} use:enhance>
	<Button
		type="submit"
		onclick={() => {
			clearCache(client);
		}}
		class="mx-2 flex w-full items-center bg-slate-100 text-red-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
	>
		<LogOut class="mr-1" />
		<span>Log out</span>
	</Button>
</form>
