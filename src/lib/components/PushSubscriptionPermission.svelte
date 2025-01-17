<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let { isOpen, onConfirm, onCancel } = $props();

	function handleConfirm() {
		onConfirm();
		isOpen = false;
	}

	function handleCancel() {
		onCancel();
		isOpen = false;
	}
</script>

<AlertDialog.Root bind:open={isOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Stay Updated with Notifications</AlertDialog.Title>
			<AlertDialog.Description>
				Enable push notifications to receive timely updates and reminders, such as event activity
				and daily insights. You can manage or turn off notifications anytime in your settings. Your
				privacy matters, and we will never send spam.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={handleCancel}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleConfirm}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
