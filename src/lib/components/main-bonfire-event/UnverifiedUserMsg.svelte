<script lang="ts">
	import { Copy, KeyRound } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import { env as publicEnv } from '$env/dynamic/public';
	import { toast } from 'svelte-sonner';
	import { tempAttendeeSecretParam } from '$lib/enums';

	let { eventId, tempAttendee, tempAttendeeSecret } = $props();

	const handleCopyingTempAccountUrl = async (eventId: string) => {
		// Prepare shareable data
		let url = `${publicEnv.PUBLIC_ORIGIN}/bonfire/${eventId}?${tempAttendeeSecretParam}=${tempAttendeeSecret}`;

		// Add data to clipboard
		try {
			await navigator.clipboard.writeText(url);
			toast.success('URL copied to clipboard');
		} catch (error) {
			console.error('Error copying to clipboard:', error);
			toast.success('Sorry, an error occurred, please try again later or contact support');
		}
	};
</script>

<div
	class="my-4 flex flex-col items-center justify-center space-y-2 rounded-lg bg-gradient-to-r from-violet-200 to-pink-200 p-5 text-center dark:from-violet-900 dark:to-pink-900"
>
	{#if tempAttendee}
		<p class="font-semibold">Hi {tempAttendee.name}! This is a temporary account</p>
	{:else}
		<p class="font-semibold">Hi! This is a temporary account</p>
	{/if}
	<p class="text-sm">
		Keep this tab open for seamless access, or click the button below to copy the URL and save it.
	</p>
	<p class="text-sm">This URL grants access to the event with your temporary identity.</p>
	<p class="text-sm">Sign up anytime to link your events to your email.</p>
	<a href="/login" class="w-full">
		<Button
			class="mt-4 flex w-full items-center justify-center bg-blue-500 text-white hover:bg-blue-400"
		>
			<KeyRound class="h-5 w-5" />
			Sign Up or Log In</Button
		>
	</a>
	<Button
		onclick={() => handleCopyingTempAccountUrl(eventId)}
		class="mt-4 flex w-full items-center justify-center dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
	>
		<Copy class="h-5 w-5" />
		Copy Link</Button
	>
</div>
