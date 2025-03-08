<script lang="ts">
	import {
		MapLibre,
		DefaultMarker,
		NavigationControl,
		ScaleControl,
		FullscreenControl,
		type LngLatLike
	} from 'svelte-maplibre';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { MapPin, Check, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { env as publicEnv } from '$env/dynamic/public';

	let { geocodedLocation = $bindable<any>(), onSave } = $props();

	const MAP_STYLE = `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${publicEnv.PUBLIC_STADIA_MAPS_TOKEN}`;

	let isDialogOpen = $state(false);

	// Create a reactive `LngLatLike` state
	let geolocation: LngLatLike = $state([
		geocodedLocation?.data?.longitude || -122.4194,
		geocodedLocation?.data?.latitude || 37.7749
	]);

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
			class="focus:outline-none focus-visible:ring-0 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-500"
			><MapPin class="!h-5 !w-5" /></Button
		>
	</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Set Event Location</Dialog.Title>
			<Dialog.Description>Move the map to set the event location.</Dialog.Description>
		</Dialog.Header>

		<!-- Map Container -->
		<div class="relative h-[300px] w-full overflow-hidden rounded-lg">
			<MapLibre bind:this={mapRef} center={geolocation} zoom={14} class="map" style={MAP_STYLE}>
				<NavigationControl position="top-left" showCompass={false} />
				<FullscreenControl position="top-left" />
				<DefaultMarker bind:lngLat={geolocation} draggable></DefaultMarker>
				<ScaleControl />
			</MapLibre>
		</div>

		<!-- Action Buttons -->
		<Dialog.Footer class="mt-4 flex justify-between">
			<Button onclick={locateUser} class="flex items-center gap-2">
				<MapPin class="h-4 w-4" />
				Use My Location
			</Button>
			<Button onclick={handleSaveLocation} class="flex items-center gap-2">
				<Check class="h-4 w-4" />
				Save
			</Button>
			<Dialog.Close>
				<Button variant="outline" class="flex items-center gap-2">
					<X class="h-4 w-4" />
					Cancel
				</Button>
			</Dialog.Close>
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
