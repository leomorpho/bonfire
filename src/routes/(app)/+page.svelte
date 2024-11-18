<script lang="ts">
	import About from '$lib/components/About.svelte';
	import FAQ from '$lib/components/FAQ.svelte';
	import FeatureCarousel from '$lib/components/FeatureCarousel.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Pricing from '$lib/components/Pricing.svelte';
	import { onMount } from 'svelte';
	import type { TriplitClient } from '@triplit/client';
	import { feTriplitClient } from '$lib/triplit';

	let client = feTriplitClient as TriplitClient;

	onMount(() => {
		async function clearCache() {
			await client.reset();
		}

		clearCache().catch((error) => {
			console.error('Failed to reset triplit local db on logout:', error);
		});
	});
</script>

<Hero />
<FeatureCarousel />
<About />
<Pricing />
<FAQ />
<Footer></Footer>
