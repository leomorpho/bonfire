<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.ts';

	let {
		cls=null,
		children = null,
		continueCallback,
		isOpen = $bindable(false),
		disabled = false,
		dialogHeader = 'Are you absolutely sure?',
		dialogDescription = 'Explain what it does here',
		cancelText = 'Cancel',
		continueText = 'Continue'
	} = $props();

	async function handleContinue() {
		if (typeof continueCallback === 'function') {
			await continueCallback(); // Call the provided callback
		}
		isOpen = false;
		console.log('Closed dialog');
	}
</script>

<AlertDialog.Root
	open={isOpen}
	onOpenChange={(open) => {
		isOpen = open; // Synchronize dialog state
	}}
>
	<AlertDialog.Trigger {disabled} class={cls}>
		{#if children}
			{@render children()}
		{/if}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{dialogHeader}</AlertDialog.Title>
			<AlertDialog.Description>
				{dialogDescription}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>{cancelText}</AlertDialog.Cancel>
			<AlertDialog.Action class="bg-red-500 hover:bg-red-400" onclick={handleContinue}
				>{continueText}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
