<script lang="ts">
	import { percentProfitsToCharity } from '$lib/enums';
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
				'By default, Bonfires are private and accessible only via their unique URL. If shared publicly, privacy depends on how you distribute the link. Be mindful of who you share it with.'
		},
		{
			question: 'Can I share my Bonfire with people who don\'t have a Bonfire account?',
			answer: 'Yes! You can share your Bonfire with anyone, even if they don’t have an account. Just send them the Bonfire URL.'
		},
		{
			question: 'What are Logs?',
			answer: 'A Log lets you host one Bonfire. Each account starts with 3 free Logs, allowing you to create up to 3 Bonfires to try our platform out.'
		},
		// {
		// 	question: 'How does the referral program work?',
		// 	answer: 'Our referral program allows you to earn free Logs by inviting your friends to join Bonfire using your referral link. For every friend that creates an account through your referral link, you will receive one free Log.'
		// },
		// {
		// 	question: 'Can\’t I just create more accounts for more free Bonfires?',
		// 	answer: 'Yes! We believe that everyone deserves to enjoy the Bonfire experience, and if that means creating multiple accounts to get more free Bonfires, then we\'re all for it. Although when you do choose to pay for additional Logs, you help us keep the app running smoothly and support the causes that matter to you.'
		// },
		{
			question: 'If I make a purchase, where does my money go?',
			answer: `When you buy additional Logs, ${percentProfitsToCharity}% of our profits support a nonprofit of your choice within the app. The rest helps keep Bonfire running smoothly. I (Toby) appreciate your support and am dedicated to giving you the best experience possible.`
		},
		{
			question: 'How can I contact Bonfire if I have a question or issue?',
			answer: 'Contact me at info@bnfr-events.app - I\'m here to help and will respond as soon as possible.'
		},
	];
</script>

<Container>
	<div id="faq" class="mx-auto max-w-2xl py-5 sm:py-15 mb-10">
		<div class="mt-2 text-center text-3xl font-bold tracking-tight sm:text-4xl">FAQ</div>
		<div class="text-md mt-2 text-center leading-6 sm:mt-4 sm:text-lg sm:leading-8">
			Still have questions? We've got you covered!
		</div>
		<div class="mt-5 md:mt-3 lg:mt-5">
			<div class="join join-vertical w-full bg-slate-200 dark:bg-black">
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
