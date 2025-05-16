<script lang="ts">
	import { Bird, Flame } from 'lucide-svelte';
	import Container from '../Container.svelte';
	import Button from '../ui/button/button.svelte';
	// import BorderBeam from '../effects/border-beam/border-beam.svelte';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import { env as publicEnv } from '$env/dynamic/public';

	import PricingFeature from './PricingFeature.svelte';
	import { Asterisk } from '@lucide/svelte';
	import { percentProfitsToCharity } from '$lib/enums';
</script>

{#snippet warning()}
	<div class="absolute -right-3 top-0">
		<HoverCard.Root>
			<HoverCard.Trigger>
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-orange-300 text-black hover:bg-orange-200 dark:bg-orange-500 dark:text-white dark:hover:bg-orange-400"
				>
					<Asterisk class="h-4 w-4" />
				</div>
			</HoverCard.Trigger>
			<HoverCard.Content>
				One log supports a single bonfire with up to {publicEnv.PUBLIC_NUM_ATTENDEES_PER_LOG} guests.
				If you exceed this limit, your live event can still grow, and you can pay later.
			</HoverCard.Content>
		</HoverCard.Root>
	</div>
{/snippet}

<Container>
	<div id="pricing" class="py-10 sm:py-20">
		<div class="mx-auto flex w-fit flex-wrap justify-center gap-10 md:gap-16">
			<!-- Basic package -->
			<div class="card max-w-80 rounded-3xl bg-blue-100 p-8 shadow-xl dark:bg-blue-900">
				<h3 class="mb-2 text-xl font-extrabold text-slate-800 dark:text-slate-200">
					Free Events (Beta)
				</h3>
				<div class="text-5xl font-extrabold leading-snug">
					$0 <span class="text-base font-bold">usd</span>
					<span class="text-2xl font-medium">/ Bonfire</span>
				</div>
				<ul class="mb-10 mt-3 space-y-5 sm:mb-20">
					<PricingFeature
						featureText={'Create unlimited free events with no attendee limits. This is a beta offer and can change at any time.'}
					></PricingFeature>
					<PricingFeature featureText={'RSVP to any Bonfire for free'} />
					<PricingFeature featureText={'Personalize the look and feel of your events: backgrounds, fonts and more!'} />
				</ul>
				<a class="mt-auto" href="/login">
					<Button variant="secondary" class="w-full bg-slate-500 text-white dark:bg-slate-500">
						<Bird /> Get Started
					</Button>
				</a>
			</div>

			<div class="card max-w-80 rounded-3xl bg-blue-100 p-8 shadow-xl dark:bg-blue-900">
				<h3 class="mb-2 text-xl font-extrabold text-slate-800 dark:text-slate-200">
					Curated Events
				</h3>
				<div class="text-5xl font-extrabold leading-snug">
					$10 <span class="text-base font-bold">usd</span>
					<span class="text-2xl font-medium">/ Bonfire</span>
				</div>
				<ul class="mb-10 mt-3 space-y-5 sm:mb-20">
					<PricingFeature
						featureText={'Discover curated events tailored just for you! Dinners, drinks, outdoor BBQs and +'}
					/>
					<PricingFeature
						featureText={'Our AI matcher connects you with like-minded individuals in your city based on a short questionnaire.'}
					/>
				</ul>
				<a class="mt-auto" href="/login">
					<Button variant="secondary" class="w-full bg-slate-500 text-white dark:bg-slate-500">
						<Bird /> Get Started
					</Button>
				</a>
			</div>

			<div
				class="card relative max-w-80 rounded-3xl bg-purple-100 p-8 shadow-xl dark:bg-purple-900"
			>
				<h3 class="mb-2 text-xl font-extrabold text-slate-800 dark:text-slate-200">
					Ticketed Events (Coming Soon!)
				</h3>
				<div class="text-5xl font-extrabold leading-snug">Coming Soon!</div>
				<ul class="mb-10 mt-3 space-y-5 sm:mb-20">
					<PricingFeature featureText={'Set custom ticket prices'} />
					<PricingFeature featureText={'Collect payments securely'} />
					<PricingFeature featureText={'Track ticket sales and revenue'} />
					<PricingFeature featureText={'Integration with multiple payment platforms'} />
				</ul>
				<a class="mt-auto" href="/login">
					<Button class="w-full bg-purple-500 text-white">
						<Flame /> Notify Me
					</Button>
				</a>
			</div>
		</div>
	</div>
</Container>
