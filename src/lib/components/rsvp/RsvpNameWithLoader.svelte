<script lang="ts">
	let { children, isLoading = $bindable<boolean>() } = $props();

	let isClicked = $state(false);
	function handleClick() {
		isClicked = true;
	}
</script>

<button class="flex items-center justify-between" onclick={handleClick}>
	{#if isLoading && isClicked}
		<div class="loading loading-spinner loading-xs mr-2"></div>
	{:else}
		<div></div>
	{/if}
	{@render children()}
	<div></div>
</button>
