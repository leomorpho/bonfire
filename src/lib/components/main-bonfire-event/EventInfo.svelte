<script lang="ts">
	import { Calendar, Car, UserRound } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import BonfireBanner from './BonfireBanner.svelte';
	import { formatHumanReadable, formatHumanReadableHour } from '$lib/utils';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import ShareLocation from '../ShareLocation.svelte';
	import Map from '$lib/components/map/Map.svelte';
	// import DOMPurify from 'dompurify';
	// import EventDetails from './EventDetails.svelte';
	import UpdateableEventField from './info/UpdateableEventField.svelte';
	import { eventInputTypes } from '$lib/enums';
	import { fade } from 'svelte/transition';

	let {
		eventId,
		bannerInfo,
		isCurrenUserEventAdmin,
		eventOrganizerId,
		eventOrganizerUsername,
		eventTitle,
		eventDescription,
		eventStartTime,
		eventEndTime = null,
		rsvpStatus = null,
		eventLocation = null,
		latitude = null,
		longitude = null
	} = $props();

	let isMapPresent = $derived(latitude && longitude);
</script>

<div class="relative mt-5 space-y-3 rounded-xl py-2 sm:mt-0" in:fade={{ duration: 300 }}>
	<div id="event-title" class="flex w-full justify-center">
		<UpdateableEventField
			fieldValue={eventTitle}
			placeholder={"Emily's birthday party!"}
			fieldName="title"
			{eventId}
			isAdmin={isCurrenUserEventAdmin}
			inputType={eventInputTypes.textarea}
		/>
	</div>
	{#if bannerInfo && bannerInfo.bannerIsSet}
		<BonfireBanner
			blurhash={bannerInfo.bannerBlurHash}
			bannerSmallSizeUrl={bannerInfo.bannerSmallSizeUrl}
			bannerLargeSizeUrl={bannerInfo.bannerLargeSizeUrl}
			{isCurrenUserEventAdmin}
		/>
	{:else if isCurrenUserEventAdmin}
		<a class="flex w-full" href="banner/upload">
			<Button class="fdark:text-white w-full dark:bg-slate-700 dark:hover:bg-slate-600"
				>Set a banner image</Button
			>
		</a>
	{/if}

	<div class="flex w-full justify-center">
		<div class="w-fit">
			{@render updateableDescription('lg')}
		</div>
	</div>
	<div class="flex w-full text-sm lg:space-x-3">
		<div
			class={`flex h-fit w-full items-center rounded-xl bg-slate-100/70 p-2 text-center shadow-lg dark:bg-slate-900/70 ${isMapPresent ? 'flex-col md:flex md:flex-row md:space-x-5 lg:space-x-10' : 'flex-col'}`}
		>
			<div class={`${isMapPresent ? 'w-full md:w-1/2 ' : 'w-full'}`}>
				<div class="flex w-full items-center justify-center font-medium">
					<Calendar class="mr-2 !h-4 !w-4 shrink-0" />{formatHumanReadable(eventStartTime)}
					{#if eventEndTime}to {formatHumanReadableHour(eventEndTime)}{/if}
				</div>
				<div class="my-2 flex items-center justify-center font-light">
					{#if eventOrganizerId}
						<UserRound class="mr-2 !h-4 !w-4 shrink-0" />Hosted by
						<span class="ml-1 font-bold">{eventOrganizerUsername}</span>
						{#if rsvpStatus}
							<div class="ml-2">
								<ProfileAvatar userId={eventOrganizerId} />
							</div>
						{/if}
					{/if}
				</div>

				<div class="flex items-center justify-center font-light">
					{#if rsvpStatus}
						{#if eventLocation || (latitude && longitude)}
							<div class="flex items-center justify-center">
								{#if latitude && longitude}
									<ShareLocation lat={latitude} lon={longitude}>
										<div
											id="share-location"
											class="mt-2 flex items-center justify-center rounded-xl bg-slate-100 p-2 dark:bg-slate-800"
										>
											{#if eventLocation}
												<!-- {@html DOMPurify.sanitize(eventLocation)} -->
												{@html eventLocation}
											{:else if latitude && longitude}
												Get Directions
											{/if}
											<Car class="ml-2 !h-4 !w-4 shrink-0" />
										</div>
									</ShareLocation>
								{:else}
									<div class="flex items-center justify-center p-2">
										{eventLocation}
									</div>
								{/if}
							</div>
						{:else}
							<div>No address set</div>
						{/if}
					{:else}
						Set RSVP status to see location
					{/if}
				</div>
			</div>
			{#if isMapPresent}
				<div class="m-2 w-full px-1.5 md:w-1/2">
					<Map {latitude} {longitude} />
				</div>
			{/if}
		</div>
	</div>
</div>

{#snippet updateableDescription(id: string)}
	<UpdateableEventField
		fieldValue={eventDescription}
		placeholder={"Emily's birthday party!"}
		fieldName="description"
		textClasses="prose prose-sm w-full overflow-hidden 
             text-black ease-in-out sm:prose-base focus:outline-none prose-h1:text-black prose-h2:text-black 
            prose-p:text-black prose-blockquote:text-black prose-strong:text-black 
            dark:text-white dark:prose-h1:text-white dark:prose-h2:text-white dark:prose-p:text-white 
            dark:prose-strong:text-white text-left"
		{eventId}
		isAdmin={isCurrenUserEventAdmin}
		inputType={eventInputTypes.eventdetails}
		{id}
	/>
{/snippet}
