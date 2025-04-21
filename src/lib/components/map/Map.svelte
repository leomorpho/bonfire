<script lang="ts">
	import {
		MapLibre,
		DefaultMarker,
		NavigationControl,
		ScaleControl,
		FullscreenControl
	} from 'svelte-maplibre';

	let { latitude, longitude } = $props();

	let map: any = $state();

	// Create a reactive `LngLatLike` state
	let geolocation: any = $state([longitude, latitude]);

	$effect(() => {
		longitude = geolocation[0];
		latitude = geolocation[1];

		console.log('latitude', latitude, 'longitude', longitude);
	});

	const handleMapLoad = (mapInstance: any) => {
		map = mapInstance;

		// Automatically click the attribution button to collapse it
		setTimeout(() => {
			const summaryButton = document.querySelector(
				'.maplibregl-ctrl-attrib-button'
			) as HTMLSummaryElement;

			if (summaryButton) {
				summaryButton.click();
			}
		}, 100); // Add a small delay to ensure the element is rendered

		// Disable dragging by default
		map.dragPan.disable();

		// Enable dragging on click
		map.on('click', () => {
			map.dragPan.enable();
		});
	};
</script>

<!-- Map Container -->
<div class="relative h-[200px] w-full overflow-hidden rounded-lg">
	<MapLibre
		center={geolocation}
		zoom={14}
		class="map"
		style={'https://tiles.stadiamaps.com/styles/alidade_smooth.json'}
		onload={handleMapLoad}
		dragPan={false}
	>
		<NavigationControl position="top-left" showCompass={false} />
		<FullscreenControl position="top-left" />
		<DefaultMarker lngLat={geolocation} draggable={false}></DefaultMarker>
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
