<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate, afterNavigate } from '\$app/navigation';

	let isLoading: boolean = $state(false);

	function handleBeforeNavigate() {
		isLoading = true;
	}

	function handleAfterNavigate() {
		isLoading = false;
	}

	onMount(() => {
		beforeNavigate(handleBeforeNavigate);
		afterNavigate(handleAfterNavigate);

		return () => {
			beforeNavigate(() => {});
			afterNavigate(() => {});
		};
	});
</script>

{#if isLoading}
	<div
		class="fixed left-0 top-0 z-[1000] flex h-screen w-screen items-center justify-center bg-slate-100/30 dark:bg-slate-900/30"
	>
		<span class="loader"></span>
	</div>
{/if}

<style>
	.loader {
		animation: rotate 1s infinite;
		height: 50px;
		width: 50px;
	}

	.loader:before,
	.loader:after {
		border-radius: 50%;
		content: '';
		display: block;
		height: 20px;
		width: 20px;
	}
	.loader:before {
		animation: ball1 1s infinite;
		background-color: #fff;
		box-shadow: 30px 0 0 #ff3d00;
		margin-bottom: 10px;
	}
	.loader:after {
		animation: ball2 1s infinite;
		background-color: #ff3d00;
		box-shadow: 30px 0 0 #fff;
	}

	@keyframes rotate {
		0% {
			transform: rotate(0deg) scale(0.8);
		}
		50% {
			transform: rotate(360deg) scale(1.2);
		}
		100% {
			transform: rotate(720deg) scale(0.8);
		}
	}

	@keyframes ball1 {
		0% {
			box-shadow: 30px 0 0 #ff3d00;
		}
		50% {
			box-shadow: 0 0 0 #ff3d00;
			margin-bottom: 0;
			transform: translate(15px, 15px);
		}
		100% {
			box-shadow: 30px 0 0 #ff3d00;
			margin-bottom: 10px;
		}
	}

	@keyframes ball2 {
		0% {
			box-shadow: 30px 0 0 #fff;
		}
		50% {
			box-shadow: 0 0 0 #fff;
			margin-top: -20px;
			transform: translate(15px, 15px);
		}
		100% {
			box-shadow: 30px 0 0 #fff;
			margin-top: 0;
		}
	}
</style>
