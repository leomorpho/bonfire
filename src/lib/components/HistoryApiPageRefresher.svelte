<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		const handlePopState = () => {
			// Trigger a navigation action when the URL changes
			goto(window.location.pathname, { replaceState: true });
		};

		// Listen for popstate events (back/forward navigation)
		window.addEventListener('popstate', handlePopState);

		return () => {
			// Clean up the event listener when the component is destroyed
			window.removeEventListener('popstate', handlePopState);
		};
	});
</script>
