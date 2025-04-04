<script lang="ts">
	import { Bird, Flame } from 'lucide-svelte';
	import Container from '../Container.svelte';
	import Button from '../ui/button/button.svelte';
	// import BorderBeam from '../effects/border-beam/border-beam.svelte';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import { env as publicEnv } from '$env/dynamic/public';

	import PricingFeature from './PricingFeature.svelte';
	import { Asterisk } from '@lucide/svelte';
</script>

{#snippet warning()}
	<div class="absolute -right-1 top-2">
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
				<!-- <BorderBeam size={250} duration={30} borderWidth={2} cls="rounded-3xl" /> -->

				<h3 class="mb-2 text-xl font-extrabold text-slate-800 dark:text-slate-200">Use for Free</h3>
				<div class="text-5xl font-extrabold leading-snug">
					$0 <span class="text-base font-bold">usd</span>
					<span class="text-3xl font-medium">/ Bonfire</span>
				</div>
				<ul class="mb-10 mt-3 space-y-5 sm:mb-20">
					<div class="relative">
						<PricingFeature
							featureText={"When you create an account, you'll get 3 free logs to create 3 different Bonfires"}
						></PricingFeature>
						{@render warning()}
					</div>

					<PricingFeature featureText={'RSVP to any number of Bonfires for free, always'} />
					<!-- <PricingFeature
						featureText={'Referral program: Get 1 free log for every friend that creates an account using your referral link'}
					/> -->
					<PricingFeature
						featureText={'All bonfires get deleted 14 days after they happen (can be turned off)'}
					/>
				</ul>
				<a class="mt-auto" href="/login"
					><Button variant="secondary" class="w-full bg-slate-500 text-white dark:bg-slate-500"
						><Bird /> Get Started
					</Button>
				</a>
			</div>

			<div
				class="card relative max-w-80 rounded-3xl bg-purple-100 p-8 shadow-xl dark:bg-purple-900"
			>
				<h3 class="mb-2 text-xl font-extrabold text-slate-800 dark:text-slate-200">By Donation</h3>
				<div class="text-5xl font-extrabold leading-snug">
					$1 <span class="text-base font-bold">usd</span>
					<span class="text-3xl font-medium">/ Bonfire</span>
				</div>
				<ul class="mb-10 mt-3 space-y-5 sm:mb-20">
					<PricingFeature featureText={'All free features'} />

					<div class="relative">
						<PricingFeature
							featureText={'Purchase logs in packs at a discounted rate. 1 log = 1 bonfire'}
						></PricingFeature>
						{@render warning()}
					</div>
					<PricingFeature featureText={'25% of our profits will go to a charity of your choice'} />
					<PricingFeature
						featureText={'Support our small team at Bonfire to help keep the platform run smoothly'}
					/>
				</ul>
				<a class="mt-auto" href="/login">
					<Button class="w-full bg-purple-500 text-white">
						<Flame /> Get Started
					</Button>
				</a>
			</div>
		</div>
	</div>
</Container>
