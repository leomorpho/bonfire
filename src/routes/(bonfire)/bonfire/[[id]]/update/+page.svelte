<script lang="ts">
	import EventForm from '$lib/components/eventform/EventForm.svelte';
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';
	import { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import { EventFormType } from '$lib/enums';
	import FadeIn from '$lib/components/containers/FadeIn.svelte';

	let data: any;
	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		data = useQuery(client, client.query('events').where(['id', '=', $page.params.id]));
	});
</script>

<FadeIn>
	{#if !data || data.fetching}
		<Loader />
	{:else if data.error}
		<p>Error: {data.error.message}</p>
	{:else if data.results}
		<div class="bg-color-selector min-h-screen w-full">
			<div class="bg-overlay-selector min-h-screen w-full">
				<EventForm
					mode={EventFormType.UPDATE}
					event={data.results[0]}
					currUserId={$page.data?.user.id}
				/>
			</div>
		</div>
	{/if}
</FadeIn>
