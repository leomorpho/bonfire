<script lang="ts">
	import EventCard from '../EventCard.svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import Autoscroll from 'embla-carousel-auto-scroll';
	import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let emblaApi;
	let options = { loop: true };
	let plugins = [Autoscroll({speed:1}), WheelGesturesPlugin()];

	function onInit(event) {
		if (!browser) return;

		emblaApi = event.detail;
		// console.log("WHHHHHHHAAAAAT", emblaApi.slideNodes()); // Access API

		const carousel = document.querySelector('.embla');
		carousel?.classList.remove('invisible');
		carousel?.classList.add('animate-fadeIn');

		const slides = carousel?.querySelectorAll('.embla__slide');
		slides?.forEach((slide) => {
			slide.classList.remove('hidden');
			slide.classList.add('animate-fadeIn');
		});
	}
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

	onMount(() => {});
</script>

<div
	class="embla invisible mt-3 h-[330px] overflow-hidden"
	use:emblaCarouselSvelte={{ options, plugins }}
	onemblaInit={onInit}
>
	<div class="embla__container flex">
		<div class="embla__slide hidden">
			<div class="w-96 flex-shrink-0 px-2">
				<EventCard
					eventId="wedding-1"
					eventTitle="John & Jane's Wedding"
					eventDescription="Join us for a beautiful wedding ceremony."
					eventStartTime={futureDate1}
					eventEndTime={new Date(futureDate1.getTime() + 4 * 60 * 60 * 1000)}
					eventLocation="St. Mary's Church"
					eventCreatorId="1"
					eventCreatorName="Benjamin Lee"
					overlayColor="background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.526); font-family: 'Raleway', sans-serif;;"
					style={`
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/brijan.gif'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
     
        `}
					fontStr={`{"name":"Alice","style":"font-family: 'Alice', serif;","cdn":"https://fonts.googleapis.com/css2?family=Alice&display=swap"}`}
					isDemo={true}
				/>
			</div>
		</div>

		<div class="embla__slide hidden">
			<div class="w-96 flex-shrink-0 px-2">
				<EventCard
					eventId="birthday-1"
					eventTitle="Emily's 30th Birthday"
					eventDescription="Celebrate Emily's 30th birthday with music and games."
					eventStartTime={futureDate2}
					eventEndTime={new Date(futureDate2.getTime() + 4 * 60 * 60 * 1000)}
					eventLocation="123 Party Street"
					eventCreatorId="2"
					eventCreatorName="Alice B"
					overlayColor="background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.526); font-family: 'Raleway', sans-serif;;"
					style={`
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/quake.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
        `}
					fontStr={`{"name":"DotGothic16","style":"font-family: 'DotGothic16', sans-serif;","cdn":"https://fonts.googleapis.com/css2?family=DotGothic16&display=swap"}`}
					isDemo={true}
				/>
			</div>
		</div>

		<div class="embla__slide hidden">
			<div class="w-96 flex-shrink-0 px-2">
				<EventCard
					eventId="conference-1"
					eventTitle="Tech Summit 2024"
					eventDescription="Join industry leaders for talks and networking."
					eventStartTime={futureDate3}
					eventEndTime={new Date(futureDate3.getTime() + 8 * 60 * 60 * 1000)}
					eventLocation="Convention Center"
					eventCreatorId="3"
					eventCreatorName="Charlotte Davis"
					overlayColor="background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.526); font-family: 'Raleway', sans-serif;;"
					style={`    
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/asteroids.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
        `}
					fontStr={`{"name":"AdventPro","style":"font-family: 'Advent Pro', sans-serif; font-size: 1.4em;","cdn":"https://fonts.googleapis.com/css2?family=Advent+Pro&display=swap"}`}
					isDemo={true}
				/>
			</div>
		</div>

		<div class="embla__slide hidden">
			<div class="w-96 flex-shrink-0 px-2">
				<EventCard
					eventId="festival-1"
					eventTitle="Summer Music Fest"
					eventDescription="Enjoy live performances from top artists."
					eventStartTime={futureDate4}
					eventEndTime={new Date(futureDate4.getTime() + 10 * 60 * 60 * 1000)}
					eventLocation="City Park"
					eventCreatorId="4"
					eventCreatorName="Daniel Martinez"
					overlayColor="background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.526); font-family: 'Raleway', sans-serif;;"
					style={`
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/kiwis.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
        `}
					fontStr={`{"name":"Mansalva","style":"font-family: 'Mansalva', cursive; font-size: 1.8em;","cdn":"https://fonts.googleapis.com/css2?family=Mansalva&display=swap"}`}
					isDemo={true}
				/>
			</div>
		</div>

		<div class="embla__slide hidden">
			<div class="w-96 flex-shrink-0 px-2">
				<EventCard
					eventId="workshop-1"
					eventTitle="Photography Workshop"
					eventDescription="Learn advanced photography techniques."
					eventStartTime={futureDate5}
					eventEndTime={new Date(futureDate5.getTime() + 6 * 60 * 60 * 1000)}
					eventLocation="Art Studio"
					eventCreatorId="5"
					eventCreatorName="Emily Wilson"
					overlayColor="background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.526); font-family: 'Raleway', sans-serif;;"
					style={`
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/ahoy.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;         
        `}
					fontStr={`{"name":"TwinkleStar","style":"font-family: 'Twinkle Star', cursive; font-size: 1.8em;","cdn":"https://fonts.googleapis.com/css2?family=Twinkle+Star&display=swap"}`}
					isDemo={true}
				/>
			</div>
		</div>
		<div class="embla__slide hidden">
			<div class="w-96 flex-shrink-0 px-2">
				<EventCard
					eventId="fundraiser-1"
					eventTitle="Charity Gala"
					eventDescription="Support local charities with an evening of entertainment."
					eventStartTime={futureDate6}
					eventEndTime={new Date(futureDate6.getTime() + 4 * 60 * 60 * 1000)}
					eventLocation="Community Hall"
					eventCreatorId="6"
					eventCreatorName="Frederick Brown"
					overlayColor="background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.526); font-family: 'Raleway', sans-serif;;"
					style={`
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/green-goblin.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
        `}
					fontStr={`{"name":"SpecialElite","style":"font-family: 'Special Elite', cursive;","cdn":"https://fonts.googleapis.com/css2?family=Special+Elite&display=swap"}`}
					isDemo={true}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fadeIn {
		animation: fadeIn 0.7s ease-out;
	}
</style>
