<script lang="ts">
	// Any TypeScript logic can go here if needed
	const { message } = $props();
</script>

<div class="center-screen">
	<p class="m-2 rounded-lg bg-slate-100 p-4 text-xl">
		{message}
	</p>
</div>

<style>
	.center-screen {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh; /* Full viewport height */
		text-align: center; /* Align text in case it's multiline */
	}
</style>
