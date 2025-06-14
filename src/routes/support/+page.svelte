<script lang="ts">
	import SupportChat from '$lib/components/support/SupportChat.svelte';
</script>

<svelte:head>
	<title>Support - Bonfire</title>
	<meta name="description" content="Get help from the Bonfire support team" />
</svelte:head>

<div class="fixed inset-0 flex flex-col">
	<!-- Main support chat interface -->
	<div class="flex-1 min-h-0">
		<SupportChat />
	</div>
</div>