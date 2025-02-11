<script>
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
	<Dialog.Trigger class="w-full focus:outline-none focus-visible:ring-0">
		<ImThreadView
			{eventId}
			{currUserId}
			{profileImageMap}
			{threadId}
			{canSendIm}
			maxNumMessages={2}
			{datetimeUserJoinedBonfire}
		/>
	</Dialog.Trigger>
	<Dialog.Content class="flex h-screen flex-col">
		<Dialog.Description class="flex-1 overflow-hidden px-2">
			<!-- Ensures full height usage -->
			<ImThreadView
				{eventId}
				{currUserId}
				{profileImageMap}
				{threadId}
				{canSendIm}
				{datetimeUserJoinedBonfire}
			/>
		</Dialog.Description>
	</Dialog.Content>
</Dialog.Root>
