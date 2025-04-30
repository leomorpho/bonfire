<script lang="ts">
	import About from '$lib/components/About.svelte';
	import FAQ from '$lib/components/landing/FAQ.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import Pricing from '$lib/components/landing/Pricing.svelte';
	import AboutUs from '$lib/components/landing/AboutUs.svelte';
	import Features from '$lib/components/landing/Features.svelte';
	import EventCards from '$lib/components/landing/EventCards.svelte';
</script>

<div class="w-full overflow-x-hidden">
	<Hero />
	<EventCards />
	<!-- <About /> -->
	<Features />
	<Pricing />
	<AboutUs />
	<FAQ />
	<Footer></Footer>
</div>
