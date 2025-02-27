<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import GoogleMapsIcon from './icons/GoogleMapsIcon.svelte';
	import BingIcon from './icons/BingIcon.svelte';
	import WazeIcon from './icons/WazeIcon.svelte';
	import AppleMapsIcon from './icons/AppleMapsIcon.svelte';

	let { children, lat, lon } = $props();

	const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
	const appleMapsUrl = `https://maps.apple.com/?ll=${lat},${lon}`;
	const wazeUrl = `https://www.waze.com/ul?ll=${lat},${lon}&navigate=yes`;
	const bingMapsUrl = `https://www.bing.com/maps?cp=${lat}~${lon}`;
	const mapsMe = `mapsme://map?v=1&ll=${lat},${lon}`;

	// icons found at https://simpleicons.org/ and https://icons8.com/icons/set/apple-maps
</script>

<Dialog.Root>
	<Dialog.Trigger class="w-full">
		{@render children()}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title class="flex w-full justify-center">Open in mapping app</Dialog.Title>
			<Dialog.Description class="items-center justify-center ">
				<div
					class="mt-5 grid grid-cols-2 items-center justify-center gap-4 sm:mt-10 lg:grid-cols-4"
				>
					<a
						href={googleMapsUrl}
						target="_blank"
						id="google-maps-icon"
						class="flex h-full w-full items-center justify-center"
					>
						<div class="m-4 h-16 w-16 sm:h-20 sm:w-20"><GoogleMapsIcon /></div>
					</a>
					<a
						href={appleMapsUrl}
						target="_blank"
						id="apple-icon"
						class="flex h-full w-full items-center justify-center"
					>
						<div class="m-4 h-16 w-16 sm:h-20 sm:w-20"><AppleMapsIcon /></div>
					</a>
					<a
						href={wazeUrl}
						target="_blank"
						id="waze-icon"
						class="flex h-full w-full items-center justify-center"
					>
						<div class="m-4 h-16 w-16 sm:h-20 sm:w-20"><WazeIcon /></div>
					</a>
					<a
						href={bingMapsUrl}
						target="_blank"
						id="bing-icon"
						class="flex h-full w-full items-center justify-center"
					>
						<div class="m-4 h-16 w-16 sm:h-20 sm:w-20"><BingIcon /></div>
					</a>
					<!-- <a href={mapsMe} target="_blank" id="maps-me-icon">
                <div class="m-4 h-16 w-16 sm:h-20 sm:w-20"><MapsMeIcon /></div>
            </a> -->
				</div>
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer></Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
