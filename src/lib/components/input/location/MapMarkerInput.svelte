<script lang="ts">
	import {
		MapLibre,
		DefaultMarker,
		NavigationControl,
		ScaleControl,
		FullscreenControl,
		MapEvents
	} from 'svelte-maplibre';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { MapPin, Check, MapPinHouse } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	// import { env as publicEnv } from '$env/dynamic/public';

	let {
		geocodedLocation = $bindable<any>(),
		latitude = $bindable<number | null>(),
		longitude = $bindable<number | null>(),
		onSave
	} = $props();

	// const MAP_STYLE = `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${publicEnv.PUBLIC_STADIA_MAPS_TOKEN}`;

	let isDialogOpen = $state(false);

	// Create a reactive `LngLatLike` state
	let geolocation: any = $state([
		longitude ? longitude : geocodedLocation?.data?.longitude || -122.4194,
		latitude ? latitude : geocodedLocation?.data?.latitude || 37.7749
	]);

	let showUseLocationFromAddress = $derived(
		geocodedLocation?.data?.longitude != longitude || geocodedLocation?.data?.latitude != latitude
	);

	const useLocationFromAddress = () => {
		geolocation = [geocodedLocation?.data?.longitude, geocodedLocation?.data?.latitude];
		longitude = null;
		latitude = null;
	};

	$effect(() => {
		longitude = geolocation[0];
		latitude = geolocation[1];

		console.log('latitude', latitude, 'longitude', longitude);
	});

	function updateMarker(e: any) {
		geolocation = [e.lngLat.lng, e.lngLat.lat];
	}

	let mapRef: any;

	const handleSaveLocation = () => {
		try {
			onSave();
			toast.success('Nice! We updated your location');
		} catch (e) {
			toast.error(
				'Sorry, there was an error saving your location, please try again later or contact support'
			);
			console.error('failed to save geocodedLocation', e);
		}
		isDialogOpen = false;
	};

	const locateUser = () => {
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const lat = position.coords.latitude;
					const lng = position.coords.longitude;
					geolocation = [lng, lat];
					mapRef.setCenter(geolocation);
				},
				(error) => {
					console.error('Error getting location:', error);
					alert('Unable to retrieve your location.');
				}
			);
		} else {
			alert('Geolocation is not supported by your browser.');
		}
	};
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<!-- Trigger Button -->
	<Dialog.Trigger>
		<Button
			class="flex items-center bg-white text-black ring-glow hover:bg-slate-100 focus:outline-none focus-visible:ring-0 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-700"
			><MapPin class="!h-5 !w-5" /></Button
		>
	</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Set Event Location</Dialog.Title>
			<Dialog.Description>
				Move the map to set the event location.
				{#if showUseLocationFromAddress}
					<div class="mt-2 flex w-full justify-center">
						<Button onclick={useLocationFromAddress} class="mt-3 flex items-center gap-2 sm:mt-0">
							<MapPinHouse class="h-4 w-4" />
							Reset to location from address
						</Button>
					</div>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<!-- Map Container -->
		<div class="relative h-[300px] w-full overflow-hidden rounded-lg">
			<MapLibre
				bind:this={mapRef}
				center={geolocation}
				zoom={14}
				class="map"
				style={'https://tiles.stadiamaps.com/styles/alidade_smooth.json'}
			>
				<!-- MapEvents gives you access to map events even from other components inside the map,
  where you might not have access to the top-level `MapLibre` component. In this case
  it would also work to just use on:click on the MapLibre component itself. -->
				<MapEvents onclick={updateMarker} />

				<NavigationControl position="top-left" showCompass={false} />
				<FullscreenControl position="top-left" />
				<DefaultMarker bind:lngLat={geolocation} draggable></DefaultMarker>
				<ScaleControl />
			</MapLibre>
		</div>

		<!-- Action Buttons -->
		<Dialog.Footer class="mt-4 flex justify-between">
			<Button onclick={locateUser} class="mt-3 flex items-center gap-2 sm:mt-0">
				<MapPin class="h-4 w-4" />
				Use my location
			</Button>
			<Button
				onclick={handleSaveLocation}
				class="flex items-center gap-2 bg-green-500 hover:bg-green-400"
			>
				<Check class="h-4 w-4" />
				Save
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

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
