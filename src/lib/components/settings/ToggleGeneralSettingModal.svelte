<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	let { isOpen, turnSpecificOn, turnGeneralOn } = $props();
</script>

<AlertDialog.Root bind:open={isOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Enable this permission app-wide?</AlertDialog.Title>
			<AlertDialog.Description>
				This permission is currently disabled app-wide. We recommend enabling it for a better
				experience. You can still disable it for individual events if needed.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={turnSpecificOn}>No, only for this event</AlertDialog.Cancel>
			<AlertDialog.Action onclick={turnGeneralOn}>Yes</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
