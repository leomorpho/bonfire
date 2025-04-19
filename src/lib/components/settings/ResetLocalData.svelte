<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Loader from '../Loader.svelte';
	import { goto } from '$app/navigation';

	// Constant to toggle between real deletion and fake deletion for testing
	const REAL_DELETION = true;

	let isOpen = $state(false);

	// TODO: create a triplit table where we upload the progress, or use a websocket or SSE
	let isResetting = $state(false);

	const handleResetLocalData = async () => {
		isOpen = false;
		goto('/clear');
	};
</script>

<AlertDialog.Root bind:open={isOpen}>
	<AlertDialog.Trigger class="w-full">
		<Button class="w-full"
			>Reset local data</Button
		>
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Reset Local Data?</AlertDialog.Title>
			<AlertDialog.Description>
				<div class="mb-5 font-semibold">
					If you're experiencing issues, this can help by resetting your local app data.
				</div>
				Your saved data will sync back when you log back in.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action class="bg-red-500" onclick={handleResetLocalData}
				>Reset</AlertDialog.Action
			>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

{#if isResetting}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
		<div class="w-1/2">
			<p class="mb-4 text-center text-lg">Resetting device...</p>
			<Loader />
		</div>
	</div>
{/if}
