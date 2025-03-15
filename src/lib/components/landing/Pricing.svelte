<script lang="ts">
	import { Bird, Check, Flame, Ship, X } from 'lucide-svelte';
	import Container from '../Container.svelte';
	import Button from '../ui/button/button.svelte';
	import BorderBeam from '../effects/border-beam/border-beam.svelte';

	const featuresFree = {
		included: [
			"When you create an account, you'll get 3 free logs to create 3 different Bonfires",
			'RSVP to any number of Bonfires for free, always',
			'Referral program: Get 1 free log for every friend that creates an account using your referral link',
			'All bonfires get deleted 14 days after they happen'
		]
		// excluded: ['Feature 4', 'Feature 5', 'Feature 6']
	};

	const featuresPremium = {
		included: [
			'All free features',
			// '50% of payment goes to a charity ', //  TODO: add a way for user to choose
			'Purchase logs in packs at a discounted rate. 1 log = 1 bonfire',
			'25% of our profits will go to a charity of your choice',
			'Support our small team at Bonfire to help keep the platform run smoothly',
		]
	};
</script>

<Container>
	<div id="pricing" class="py-10 sm:py-20">
		<div class="mx-auto flex w-fit flex-wrap justify-center gap-10 md:gap-16">
			<!-- Basic package -->
			<div class="card max-w-80 bg-blue-100 p-8 shadow-xl dark:bg-blue-900 rounded-3xl">
				<!-- <BorderBeam size={250} duration={30} borderWidth={2} cls="rounded-3xl" /> -->

				<h3 class="mb-2 text-xl font-extrabold text-slate-800 dark:text-slate-200">Use for Free</h3>
				<div class="text-5xl font-extrabold leading-snug">
					$0 <span class="text-base font-bold">usd</span>
					<span class="text-3xl font-medium">/ Bonfire</span>
				</div>
				<ul class="mb-10 sm:mb-20 mt-3 space-y-5">
					{#each featuresFree.included as feature}
						<li class="flex items-center space-x-2">
							<Check strokeWidth={2} class="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" />
							<div class="text-slate-900 dark:text-slate-100 text-sm sm:text-base">{feature}</div>
						</li>
					{/each}
					<!-- {#each featuresFree.excluded as feature}
						<li class="flex space-x-2 text-base-content text-opacity-60">
							<X strokeWidth={1} />
							<div class="line-through">{feature}</div>
						</li>
					{/each} -->
				</ul>
				<a class="mt-auto" href="/login"
					><Button variant="secondary" class="w-full bg-slate-500 text-white dark:bg-slate-500"
						><Bird /> Get Started
					</Button>
				</a>
			</div>

			<!-- Premium package -->
			<div class="card relative max-w-80 bg-purple-100 p-8 shadow-xl dark:bg-purple-900 rounded-3xl">
				<!-- <div
					class="absolute right-5 top-5 rounded-full bg-red-500/50 px-2.5 py-1 text-xs font-semibold leading-5 text-primary"
				>
					Most popular
				</div> -->

				<h3 class="mb-2 text-xl font-extrabold text-slate-800 dark:text-slate-200">By Donation</h3>
				<div class="text-5xl font-extrabold leading-snug">
					$1 <span class="text-base font-bold">usd</span>
					<span class="text-3xl font-medium">/ Bonfire</span>
				</div>
				<ul class="mb-10 sm:mb-20 mt-3 space-y-5">
					{#each featuresPremium.included as feature}
						<li class="flex items-center space-x-2">
							<Check strokeWidth={2} class="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" />
							<div class="text-slate-900 dark:text-slate-100 text-sm sm:text-base">{feature}</div>
						</li>
					{/each}
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
