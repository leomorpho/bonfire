<script>
	let { lat, lon } = $props();

	function generateMapUrls(lat, lon) {
		return {
			googleMaps: `https://www.google.com/maps?q=${lat},${lon}`,
			appleMaps: `https://maps.apple.com/?ll=${lat},${lon}`,
			waze: `https://www.waze.com/ul?ll=${lat},${lon}&navigate=yes`,
			openStreetMap: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=16`,
			bingMaps: `https://www.bing.com/maps?cp=${lat}~${lon}`
		};
	}

    const urls = generateMapUrls(location);
</script>
