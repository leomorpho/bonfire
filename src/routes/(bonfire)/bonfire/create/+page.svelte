<script lang="ts">
	import EventForm from '$lib/components/EventForm.svelte';
	import { EventFormType } from '$lib/enums';
</script>

<div class="bg-color-selector min-h-screen w-full">
	<div class="bg-overlay-selector">
		<EventForm mode={EventFormType.CREATE} />
	</div>
</div>
