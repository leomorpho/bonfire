<script lang="ts">
	import { PhoneInput } from '$lib/jsrepo/ui/phone-input';
	import { Pencil } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';
	import type { CountryCode } from 'svelte-tel-input/types';

	let { userId, class: cls = null } = $props();

	let phoneNumber: string | null | undefined = $state(null);
	let country: CountryCode | null | undefined = $state(null);

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserPersonalData = client.subscribe(
			client
				.query('user_personal_data')
				.Where(['user_id', '=', userId])
				.Select(['phone_number', 'phone_country_code']),
			(results) => {
				if (results.length == 1) {
					const pi = results[0];
					phoneNumber = pi.phone_number;
					country = pi.phone_country_code;
				}
			},
			(error) => {
				console.log('failed to get user_personal_data', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		return () => {
			unsubscribeFromUserPersonalData();
		};
	});
</script>

<div class={`w-full space-y-5 ${cls}`}>
	<h3 class="flex justify-between text-xl font-semibold">Phone</h3>

	{#if phoneNumber}
		<div class="flex w-full items-center justify-center space-x-2">
			<PhoneInput value={phoneNumber} {country} readonly={true} disabled={true} class="w-full" />
			<a href="/settings/phone">
				<Button
					class="h-8 w-8 rounded-full bg-slate-200 text-black hover:bg-slate-300 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
				>
					<Pencil class="h-4 w-4" />
				</Button>
			</a>
		</div>
	{:else}
		<div class="flex w-full items-center justify-center">
			<a href="/settings/phone" class="w-full">
				<Button variant="outline" class="w-full">
					Add phone number
				</Button>
			</a>
		</div>
	{/if}
</div>
