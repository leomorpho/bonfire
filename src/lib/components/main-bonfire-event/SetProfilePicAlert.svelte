<script lang="ts">
	import { onMount } from 'svelte';
	import Alert from '../Alert.svelte';
	import { Button } from '../ui/button';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';

	let { currUserId } = $props();

	const client = getFeWorkerTriplitClient($page.data.jwt);

	let data = useQuery(client, client.query('profile_images').where(['user_id', '=', currUserId]));
</script>

{#if data.results?.length == 0}
	<div>
		<Alert
			type="info"
			class="max-w-[500px]"
			message="Set a profile picture so hosts can recognize you easily. Your photo stays private, visible only to fellow attendees. We value your privacy and will never sell your data."
			dismissalKey="set-profile-image-in-bonfire"
		>
			<div class="mt-3 flex w-full justify-center">
				<a href="/profile/upload-profile-image">
					<Button>Set profile picture</Button>
				</a>
			</div>
		</Alert>
	</div>
{/if}
