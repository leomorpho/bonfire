<script>
	let { cls = null } = $props();
</script>

<span class={`loader flex items-center justify-center ${cls}`}></span>

<style>
	.loader {
		border: 5px solid #fff;
		border-bottom-color: transparent;
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: rotation 1s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
