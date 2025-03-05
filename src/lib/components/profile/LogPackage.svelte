<script lang="ts">
	import LoadingSpinner from '../LoadingSpinner.svelte';
	import SvgLoader from '../SvgLoader.svelte';
	import Button from '../ui/button/button.svelte';

	let { price, price_id, num_logs, mode = 'payment', disabled = false } = $props();
	let isLoading = $state(false);

	async function handleCheckout(event: Event) {
		event.preventDefault(); // Prevent default form submission

		if (isLoading || disabled) return; // Prevent multiple clicks

		isLoading = true; // Show loader

		try {
		    const response = await fetch('/stripe/checkout-session', {
		        method: 'POST',
		        headers: { 'Content-Type': 'application/json' },
		        body: JSON.stringify({ price_id, mode })
		    });

		    const data = await response.json();
		    if (data.url) {
		        window.location.href = data.url; // Redirect to Stripe checkout
		    } else {
		        console.error('Failed to create checkout session:', data.error);
		    }
		} catch (error) {
		    console.error('Error:', error);
		} finally {
		    isLoading = false; // Hide loader (though the page will likely redirect)
		}
	}
</script>

<!-- Button with a loader -->
<Button
	onclick={handleCheckout}
	disabled={disabled || isLoading}
	class="relative my-2 flex w-full items-center justify-around bg-green-500 text-white dark:bg-green-700"
>
	{#if isLoading}
		<div class="absolute left-2 sm:left-4">
			<div class="flex items-center">
				<LoadingSpinner cls={'!h-4 !w-4'} />
			</div>
		</div>
	{/if}
	${price} for {num_logs} log{num_logs > 1 ? 's' : ''}
</Button>
