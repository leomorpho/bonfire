<script lang="ts">
	import { LoaderPinwheel } from 'lucide-svelte';
</script>

<span class="spin ml-1"><LoaderPinwheel class="h-4 w-4" /></span>

<style>
	.spin {
		animation: rotate 1s linear infinite;
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
