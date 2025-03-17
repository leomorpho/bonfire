<script lang="ts">
	import { Calendar, Car, UserRound } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import BonfireBanner from './BonfireBanner.svelte';
	import { formatHumanReadable, formatHumanReadableHour } from '$lib/utils';
	import ProfileAvatar from '../ProfileAvatar.svelte';
	import ShareLocation from '../ShareLocation.svelte';
	import Map from '$lib/components/map/Map.svelte';

	let {
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
</script>

{#snippet details(eventDescription: string | null | undefined)}
	<div
		class="flex h-fit flex-col justify-center rounded-xl bg-slate-100 p-2 py-3 text-center shadow-lg dark:bg-slate-900 md:py-5"
	>
		<div class="mb-2 font-semibold md:mb-3">Details</div>
		{#if eventDescription}
			<div class="whitespace-pre-wrap">
				{eventDescription}
			</div>
		{:else}
			{'No details yet...'}
		{/if}
	</div>
{/snippet}

<div class="relative mt-5 space-y-3 rounded-xl p-4 sm:mt-0">
	{#if bannerInfo && bannerInfo.bannerIsSet}
		<div class="flex w-full justify-center">
			<BonfireBanner
				blurhash={bannerInfo.bannerBlurHash}
				bannerSmallSizeUrl={bannerInfo.bannerSmallSizeUrl}
				bannerLargeSizeUrl={bannerInfo.bannerLargeSizeUrl}
				{isCurrenUserEventAdmin}
			/>
		</div>
	{:else if isCurrenUserEventAdmin}
		<a class="flex w-full" href="banner/upload">
			<Button class="w-full dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
				>Set a banner image</Button
			>
		</a>
	{/if}
	<div class="flex w-full justify-center">
		<h1
			class="rounded-xl bg-slate-100 p-3 px-5 text-center text-2xl font-bold dark:bg-slate-900 sm:px-10 sm:text-3xl lg:text-4xl"
		>
			{eventTitle}
		</h1>
	</div>

	<div class="flex w-full md:space-x-3">
		<div class="hidden md:block md:w-1/2">
			{@render details(eventDescription)}
		</div>
		<div
			class="h-fit w-full rounded-xl bg-slate-100 p-2 pt-5 text-center shadow-lg dark:bg-slate-900 md:w-1/2"
		>
			<div class="flex items-center justify-center font-medium">
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
				<!-- <MapPin class="mr-2 !h-4 !w-4 shrink-0" /> -->
				{#if rsvpStatus}
					{#if eventLocation || (latitude && longitude)}
						<div class="flex items-center justify-center">
							{#if latitude && longitude}
								<ShareLocation lat={latitude} lon={longitude}>
									<div
										id="share-location"
										class="mt-2 flex items-center justify-center rounded-xl bg-slate-200 p-2 dark:bg-slate-800"
									>
										{#if eventLocation}
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
			{#if latitude && longitude}
				<div class="m-2">
					<Map {latitude} {longitude} />
				</div>
			{/if}
		</div>
	</div>

	<div class="block pt-2 md:hidden">
		{@render details(eventDescription)}
	</div>
</div>
