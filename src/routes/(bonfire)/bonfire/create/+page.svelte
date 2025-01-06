<script lang="ts">
	import EventForm from '$lib/components/EventForm.svelte';
</script>

<div class="bg-color-selector min-h-screen w-full">
	<div class="bg-overlay-selector">
		<EventForm mode={'create'} />
	</div>
</div>
