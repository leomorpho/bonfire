<script lang="ts">
	import Button from '../ui/button/button.svelte';

	let { price, price_id, num_logs, mode = 'payment' } = $props();

	async function handleCheckout(event: Event) {
		event.preventDefault(); // Prevent default form submission

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
		}
	}
</script>

<!-- Replace the form with a button that triggers handleCheckout -->
<Button onclick={handleCheckout} class="w-full my-2 flex justify-around">
	${price} for {num_logs} log{num_logs > 1 ? 's' : ''}
</Button>
