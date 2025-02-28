<script lang="ts">
	import Button from '../ui/button/button.svelte';

	let { price, price_id, num_logs } = $props();
</script>

<form action="/stripe/checkout-session" method="POST" class="w-full">
	<input type="hidden" name="price_id" value={price_id} />
	<Button type="submit" class="w-full my-2 flex justify-around">${price} for {num_logs} log{num_logs > 1 ? 's' : ''}</Button>
</form>
