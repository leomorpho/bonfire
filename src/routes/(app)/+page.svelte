<script lang="ts">
	import About from '$lib/components/About.svelte';
	import FAQ from '$lib/components/FAQ.svelte';
	import FeatureCarousel from '$lib/components/FeatureCarousel.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Pricing from '$lib/components/Pricing.svelte';
	import { onMount } from 'svelte';
	import type { TriplitClient } from '@triplit/client';
	import { getFeTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import AboutUs from '$lib/components/AboutUs.svelte';

	let client: TriplitClient;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		async function clearCache() {
			await client.reset();
		}

		clearCache().catch((error) => {
			console.error('Failed to reset triplit local db on logout:', error);
		});
	});
</script>

<Hero />
<About />
<FeatureCarousel />
<Pricing />
<AboutUs />
<FAQ />
<Footer></Footer>
