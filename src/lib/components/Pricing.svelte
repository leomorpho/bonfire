<script lang="ts">
	import { Bird, Check, Flame, Ship, X } from 'lucide-svelte';
	import Container from './Container.svelte';
	import Button from './ui/button/button.svelte';

	const featuresFree = {
		included: [
			"When you create an account, you'll get 3 free logs to create 3 different Bonfires",
			'RSVP to any number of Bonfires for free, always',
			'Referral program: Get 1 free log for every friend that creates an account using your referral link'
		]
		// excluded: ['Feature 4', 'Feature 5', 'Feature 6']
	};

	const featuresPremium = {
		included: [
			'50% of payment goes to a charity of your choice',
			'Purchase logs in packs at a discounted rate. 1 log = 1 bonfire',
			'Remaining funds go to support our small team at Bonfire to help keep the platform run smoothly',
		]
	};
</script>

<!-- premium package -->
<!-- <div class="card">
	<h3>{title}</h3>
	<div>${price}usd</div>
	<ul>
		{#each features as feature}
			<li><Check /> {feature}</li>
		{/each}
	</ul>
	<a class="btn" href="/">Get Justship</a>
</div> -->

<Container>
	<div id="pricing" class="py-24 sm:py-32">
		<div class="mx-auto flex w-fit flex-wrap justify-center gap-10 md:gap-16">
			<!-- Basic package -->
			<div class="card w-80 p-8 shadow-xl ring-2 ring-base-200">
				<h3 class="mb-2 text-xl font-extrabold text-base-content text-opacity-80">Use for Free</h3>
				<div class="text-5xl font-extrabold leading-snug">
					$0 <span class="text-base font-bold">usd</span>
				</div>
				<ul class="mb-20 mt-3 space-y-5">
					{#each featuresFree.included as feature}
						<li class="flex items-center space-x-2">
							<Check strokeWidth={2} class="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" />
							<div class="text-base-content text-opacity-80">{feature}</div>
						</li>
					{/each}
					{#each featuresFree.excluded as feature}
						<li class="flex space-x-2 text-base-content text-opacity-60">
							<X strokeWidth={1} />
							<div class="line-through">{feature}</div>
						</li>
					{/each}
				</ul>
				<a class="mt-auto" href="/"><Button variant="secondary" class="w-full"><Bird /> Get Started</Button></a>
			</div>

			<!-- Premium package -->
			<div class="card relative w-80 p-8 shadow-xl ring-2 ring-primary">
				<div
					class="absolute right-5 top-5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold leading-5 text-primary"
				>
					Most popular
				</div>

				<h3 class="mb-2 text-xl font-extrabold text-base-content text-opacity-80">By Donation</h3>
				<div class="text-5xl font-extrabold leading-snug">
					$1 <span class="text-base font-bold">usd</span>
				</div>
				<ul class="mb-20 mt-3 space-y-5">
					{#each featuresPremium.included as feature}
						<li class="flex items-center space-x-2">
							<Check strokeWidth={2} class="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" />
							<div class="text-base-content text-opacity-80">{feature}</div>
						</li>
					{/each}
				</ul>
				<a class="mt-auto" href="/">
					<Button class="w-full bg-purple-500"><Flame /> Get Started</Button></a>
			</div>
		</div>
	</div>
</Container>
