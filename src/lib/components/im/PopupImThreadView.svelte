<script lang="ts">
	import { onMount } from 'svelte';
	import * as Dialog from '../ui/dialog';
	import ImThreadView from './ImThreadView.svelte';

	let {
		eventId,
		currUserId,
		profileImageMap,
		threadId = null,
		canSendIm = true,
		datetimeUserJoinedBonfire = null
	} = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger class="relative w-full focus:outline-none focus-visible:ring-0">
		<!-- Gray Veil -->
		<div class="absolute inset-0 z-10 flex items-center justify-center bg-gray-500 bg-opacity-60">
			<p class="rounded-xl bg-black p-3 text-lg font-semibold text-white">Click to see messages</p>
		</div>
		<ImThreadView
			{eventId}
			{currUserId}
			{threadId}
			{canSendIm}
			{datetimeUserJoinedBonfire}
			maxNumMessages={1}
		/>
	</Dialog.Trigger>
	<Dialog.Content class="flex h-screen flex-col">
		<Dialog.Description class="flex-1 overflow-hidden px-2">
			<!-- Ensures full height usage -->
			<ImThreadView {eventId} {currUserId} {threadId} {canSendIm} {datetimeUserJoinedBonfire} />
		</Dialog.Description>
	</Dialog.Content>
</Dialog.Root>
