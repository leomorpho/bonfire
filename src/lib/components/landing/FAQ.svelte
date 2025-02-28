<script lang="ts">
	import type { Faq } from '$lib/types';
	import Container from '../Container.svelte';

	const faqs: Array<Faq> = [
		{
			question: 'What is a Bonfire?',
			answer: 'Bonfires are private events that you can share with your friends or publicly.'
		},
		{
			question: 'Can anyone see my Bonfire',
			answer:
				'By default, Bonfires are private and can only be accessed by those who have the unique URL for the Bonfire. However, since the Bonfire URL can be shared publicly, the level of exposure is ultimately up to the discretion of how the URLs are shared. We recommend being mindful of who you share the URL with to maintain the privacy of your Bonfire.'
		},
		{
			question: 'Can I share my Bonfire with people who don\'t have a Bonfire account?',
			answer: 'Yes, you can share your Bonfire with anyone, even if they don\'t have a Bonfire account. You can share the Bonfire URL with them, and they will be able to view the event. But in order to RSVP, they\’ll need an account.'
		},
		{
			question: 'What are "Logs"?',
			answer: 'A Log is equivalent to hosting one Bonfire. When you start a Bonfire, you will use one Log from your account. With every account, you start with 3 free Logs, which means you can create up to three Bonfires. If you need more Logs to create more Bonfires, you can purchase them through our By Donation Plan.'
		},
		// {
		// 	question: 'How does the referral program work?',
		// 	answer: 'Our referral program allows you to earn free Logs by inviting your friends to join Bonfire using your referral link. For every friend that creates an account through your referral link, you will receive one free Log.'
		// },
		{
			question: 'Can\’t I just create more accounts for more free Bonfires?',
			answer: 'Yes! We believe that everyone deserves to enjoy the Bonfire experience, and if that means creating multiple accounts to get more free Bonfires, then we\'re all for it. Although when you do choose to pay for additional Logs, you help us keep the app running smoothly and support the causes that matter to you.'
		},
		// {
		// 	question: 'If I make a purchase, where does my money go?',
		// 	answer: 'If you choose to purchase additional Logs, 50% of proceeds go to a non-profit cause of your choice within the app. Remaining funds go to support the Bonfire app and helping us keep it running smoothly. As a small team, we appreciate your support and are committed to providing you with the best possible experience on our platform.'
		// },
		{
			question: 'How can I contact Bonfire if I have a question or issue?',
			answer: 'You can contact us through our support email at support@bonfireapp.com. We are committed to providing you with the best possible experience on our platform, and will do our best to respond to your inquiry as soon as possible.'
		},
	];
</script>

<Container>
	<div id="faq" class="mx-auto max-w-2xl py-24 sm:py-32">
		<div class="mt-2 text-center text-3xl font-bold tracking-tight sm:text-4xl">FAQ</div>
		<div class="text-md mt-2 text-center leading-6 sm:mt-4 sm:text-lg sm:leading-8">
			Still have questions? We've got you covered!
		</div>
		<div class="mt-5 md:mt-8 lg:mt-10">
			<div class="join join-vertical w-full">
				{#each faqs as faq}
					<div class="collapse join-item collapse-arrow border">
						<input type="radio" name="accordion" />
						<div class="collapse-title text-xl font-medium">
							{faq.question}
						</div>
						<div class="collapse-content">
							<p>{@html faq.answer}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</Container>
