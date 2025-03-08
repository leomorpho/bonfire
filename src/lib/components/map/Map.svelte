<script lang="ts">
	import {
		MapLibre,
		DefaultMarker,
		NavigationControl,
		ScaleControl,
		FullscreenControl,
		MapEvents
	} from 'svelte-maplibre';

	let { latitude, longitude } = $props();

	// Create a reactive `LngLatLike` state
	let geolocation: any = $state([longitude, latitude]);

	$effect(() => {
		longitude = geolocation[0];
		latitude = geolocation[1];

		console.log('latitude', latitude, 'longitude', longitude);
	});
</script>

<!-- Map Container -->
<div class="relative h-[200px] w-full overflow-hidden rounded-lg">
	<MapLibre
		center={geolocation}
		zoom={14}
		class="map"
		style={'https://tiles.stadiamaps.com/styles/alidade_smooth.json'}
	>
		<NavigationControl position="top-left" showCompass={false} />
		<FullscreenControl position="top-left" />
		<DefaultMarker bind:lngLat={geolocation} draggable></DefaultMarker>
		<ScaleControl />
	</MapLibre>
</div>

<style>
	:global(.map) {
		height: 100%;
		width: 100%;
	}

	/* Ensure the marker stays in the center */
	:global(.center-marker) {
		pointer-events: none;
	}
</style>
