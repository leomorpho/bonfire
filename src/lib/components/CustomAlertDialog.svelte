<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.ts';

	let {
		children,
		disabled=false,
		dialogHeader = 'Are you absolutely sure?',
		dialogDescription = 'Explain what it does here',
		cancelText = 'Cancel',
		continueText = 'Continue'
	} = $props();
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger disabled={disabled}>
		{@render children()}
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
			<AlertDialog.Action class="bg-red-500 hover:bg-red-400">{continueText}</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
