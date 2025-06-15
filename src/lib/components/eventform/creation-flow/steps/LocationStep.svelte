<script lang="ts">
	import LocationInput from '$lib/components/input/location/LocationInput.svelte';
	import type { FlowData } from '../flow-enums';
	import { MapPin } from 'lucide-svelte';

	let { data }: { data: FlowData } = $props();

	let location = $state(data.location || '');
	let geocodedLocation = $state(data.geocodedLocation || null);

	// Update data when location changes
	$effect(() => {
		data.location = location;
		data.geocodedLocation = geocodedLocation;
		
		// Extract coordinates if available
		if (geocodedLocation?.geometry?.location) {
			data.latitude = geocodedLocation.geometry.location.lat;
			data.longitude = geocodedLocation.geometry.location.lng;
		}
	});

	function handleLocationChange(event: CustomEvent) {
		location = event.detail.location;
		geocodedLocation = event.detail.geocodedLocation;
	}
</script>

<div class="space-y-4">
	<div>
		<LocationInput 
			bind:location={location}
			bind:geocodedLocation={geocodedLocation}
			on:locationChange={handleLocationChange}
		/>
		<p class="text-sm text-gray-500 mt-2">
			Enter an address, venue name, or landmark. We'll help attendees find your event.
		</p>
	</div>

	{#if geocodedLocation}
		<div class="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
			<div class="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
				<MapPin class="h-4 w-4" />
				<span class="font-medium">Location verified</span>
			</div>
			<p class="mt-1 text-sm text-green-700 dark:text-green-300">
				{geocodedLocation.formatted_address || location}
			</p>
		</div>
	{/if}
</div>