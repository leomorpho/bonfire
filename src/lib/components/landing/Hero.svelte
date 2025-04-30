<script lang="ts">
	import Container from '../Container.svelte';
	import AnimatedShinyText from '../effects/animated-shiny-text/AnimatedShinyText.svelte';
	import EventCard from '../EventCard.svelte';
	import Button from '../ui/button/button.svelte';
	import OrbitingCirclesBanner from './OrbitingCirclesBanner.svelte';

	// Function to add days to the current date and set a specific time
	const addDays = (date: Date, days: number, hours: number, minutes: number): Date => {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		result.setHours(hours, minutes, 0, 0);
		return result;
	};

	// Calculate future dates with unique starting times
	const futureDate1 = addDays(new Date(), 30, 15, 0); // 30 days from now at 8:00 AM
	const futureDate2 = addDays(new Date(), 60, 20, 30); // 60 days from now at 9:30 AM
	const futureDate3 = addDays(new Date(), 90, 9, 0); // 90 days from now at 11:00 AM
	const futureDate4 = addDays(new Date(), 120, 12, 30); // 120 days from now at 12:30 PM
	const futureDate5 = addDays(new Date(), 150, 14, 0); // 150 days from now at 2:00 PM
	const futureDate6 = addDays(new Date(), 180, 19, 30); // 180 days from now at 3:30 PM
</script>

{#snippet startBonfireBtn()}
	<div class="flex items-center justify-center sm:justify-start">
		<a href="/login">
			<div
				class="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 group relative inline-flex h-14 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-black/5 px-6 text-lg text-white transition-all ease-in dark:border-white/20"
			>
				✨
				<AnimatedShinyText
					cls="inline-flex items-center justify-center px-2 sm:px-4 sm:py-1 transition text-sm  sm:text-base ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
				>
					<span>Create an event</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
					>
						<path d="M5 12h14" />
						<path d="m12 5 7 7-7 7" />
					</svg>
				</AnimatedShinyText>
			</div>
		</a>
		<div class="mx-3 italic">it's free!</div>
	</div>
{/snippet}

<Container>
	<div class="relative flex w-full flex-col items-center justify-center md:flex-row">
		<div class="flex w-fit flex-col justify-center">
			<div
				class="pointer-events-none z-10 whitespace-pre-wrap bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text p-1 text-center text-6xl font-bold leading-none tracking-tighter text-transparent sm:mt-8 sm:text-left sm:text-7xl"
			>
				Effortless <br />Gatherings
			</div>
			<p class="text-md mb-6 mt-5 text-center sm:mb-8 sm:mt-7 sm:text-left sm:text-lg">
				The simplest way to keep your guests up to date.
			</p>
			{@render startBonfireBtn()}
		</div>

		<div class="hidden w-full min-w-[450px] p-5 sm:p-10 md:block md:w-1/2">
			<OrbitingCirclesBanner />
		</div>
	</div>
</Container>
<div class="mt-2 block overflow-x-clip md:hidden md:py-10">
	<OrbitingCirclesBanner rounded={false} />
</div>

<!-- <div class="flex space-x-3 overflow-x-auto">
	<div class="w-96 flex-shrink-0">
		<EventCard
			eventId="wedding-1"
			eventTitle="John & Jane's Wedding"
			eventDescription="Join us for a beautiful wedding ceremony."
			eventStartTime={futureDate1}
			eventEndTime={new Date(futureDate1.getTime() + 4 * 60 * 60 * 1000)}
			eventLocation="St. Mary's Church"
			eventCreatorId="1"
			eventCreatorName='Benjamin Lee'

			isDemo={true}
		/>
	</div>
	<div class="w-96 flex-shrink-0">
		<EventCard
			eventId="birthday-1"
			eventTitle="Emily's 30th Birthday"
			eventDescription="Celebrate Emily's 30th birthday with music and games."
			eventStartTime={futureDate2}
			eventEndTime={new Date(futureDate2.getTime() + 4 * 60 * 60 * 1000)}
			eventLocation="123 Party Street"
			eventCreatorId="2"
			eventCreatorName='Alice B'

			isDemo={true}
		/>
	</div>
	<div class="w-96 flex-shrink-0">
		<EventCard
			eventId="conference-1"
			eventTitle="Tech Summit 2024"
			eventDescription="Join industry leaders for talks and networking."
			eventStartTime={futureDate3}
			eventEndTime={new Date(futureDate3.getTime() + 8 * 60 * 60 * 1000)}
			eventLocation="Convention Center"
			eventCreatorId="3"
			eventCreatorName='Charlotte Davis'
			isDemo={true}
		/>
	</div>
	<div class="w-96 flex-shrink-0">
		<EventCard
			eventId="festival-1"
			eventTitle="Summer Music Fest"
			eventDescription="Enjoy live performances from top artists."
			eventStartTime={futureDate4}
			eventEndTime={new Date(futureDate4.getTime() + 10 * 60 * 60 * 1000)}
			eventLocation="City Park"
			eventCreatorId="4"
			eventCreatorName='Daniel Martinez'

			isDemo={true}
		/>
	</div>
	<div class="w-96 flex-shrink-0">
		<EventCard
			eventId="workshop-1"
			eventTitle="Photography Workshop"
			eventDescription="Learn advanced photography techniques."
			eventStartTime={futureDate5}
			eventEndTime={new Date(futureDate5.getTime() + 6 * 60 * 60 * 1000)}
			eventLocation="Art Studio"
			eventCreatorId="5"
			eventCreatorName='Emily Wilson'

			isDemo={true}
		/>
	</div>
	<div class="w-96 flex-shrink-0">
		<EventCard
			eventId="fundraiser-1"
			eventTitle="Charity Gala"
			eventDescription="Support local charities with an evening of entertainment."
			eventStartTime={futureDate6}
			eventEndTime={new Date(futureDate6.getTime() + 4 * 60 * 60 * 1000)}
			eventLocation="Community Hall"
			eventCreatorId="6"
			eventCreatorName='Frederick Brown'

			isDemo={true}
		/>
	</div>
</div> -->
