<script lang="ts">
	import AddressInput from './AddressInput.svelte';
	import MapMarkerInput from './MapMarkerInput.svelte';

	let {
		onSave = null,
		location = $bindable<string | undefined>(),
		geocodedLocation = $bindable<any>(),
		latitude = $bindable<number | null>(),
		longitude = $bindable<number | null>(),
		class: cls = null
	} = $props();

	$inspect(latitude);
</script>

<div class={`flex w-full items-center justify-between space-x-2 ${cls}`}>
	<AddressInput bind:location bind:geocodedLocation bind:latitude bind:longitude {onSave} />
	<MapMarkerInput {geocodedLocation} bind:latitude bind:longitude {onSave} />
</div>
