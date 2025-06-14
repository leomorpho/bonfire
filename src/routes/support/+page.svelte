<script lang="ts">
	import SupportChat from '$lib/components/support/SupportChat.svelte';
</script>

<svelte:head>
	<title>Support - Bonfire</title>
	<meta name="description" content="Get help from the Bonfire support team" />
</svelte:head>

<!-- Calculate available height accounting for header -->
<div class="h-[calc(100vh-4rem)] flex flex-col">
	<SupportChat />
</div>