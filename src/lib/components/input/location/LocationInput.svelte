<script lang="ts">
	import AddressInput from './AddressInput.svelte';
	import MapMarkerInput from './MapMarkerInput.svelte';

	let {
		onclick,
		location = $bindable<string | undefined>(),
		geocodedLocation = $bindable<any>()
	} = $props();
</script>

<div class="flex w-full justify-between space-x-2">
	<AddressInput bind:location bind:geocodedLocation {onclick} />
	<MapMarkerInput bind:geocodedLocation onSave={onclick}/>
</div>
