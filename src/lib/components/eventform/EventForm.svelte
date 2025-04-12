<script lang="ts">
	import { defaultMaxNumGuestsPerAttendee } from './../../enums.ts';
	import EventStyler from '../event-styles/EventStyler.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Plus,
		Minus,
		Clock,
		Clock8,
		ArrowDownToLine,
		Palette,
		Shield,
		BookCheck,
		Save,
		Undo2
	} from 'lucide-svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import { getFeHttpTriplitClient, getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { goto } from '$app/navigation';
	import type { TriplitClient } from '@triplit/client';
	import { defaultMaxEventCapacity, EventFormType, Status } from '$lib/enums';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		overlayColorStore,
		overlayOpacityStore,
		parseColor,
		styleStore,
		fontStore,
		getNextTheme,
		getNextFont
	} from '$lib/styles';
	import { generatePassphraseId } from '$lib/utils';
	import LocationInput from '../input/location/LocationInput.svelte';
	import EventAdminEditor from '../EventAdminEditor.svelte';
	import { debounce } from 'lodash-es';
	import BackButton from '../BackButton.svelte';
	import OutOfLogs from '../payments/OutOfLogs.svelte';
	import { toast } from 'svelte-sonner';
	import LoadingSpinner from '../LoadingSpinner.svelte';
	import UnpublishEventBtn from './buttons/UnpublishEventBtn.svelte';
	import DeleteEventBtn from './buttons/DeleteEventBtn.svelte';
	import TipTapTextEditor from '../input/tiptap/TipTapTextEditor.svelte';
	import MaxCapacity from './MaxCapacity.svelte';
	import GuestCountFeature from './GuestCountFeature.svelte';
	import { upsertUserAttendance } from '$lib/rsvp';
	import type { FontSelection } from '$lib/types';
	import { BellRing, Info, PaintBucket, RefreshCw, TypeOutline } from '@lucide/svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import EventReminders from './reminders/EventReminders.svelte';

	let { mode, event = null, currUserId = null } = $props();

	// ✅ Form Fields
	let eventName: string = $state(event?.title ?? ''); // State for event name
	let dateValue: DateValue | undefined = $state<DateValue | undefined>();
	let location: string = $state(event?.location ?? ''); // State for location
	let geocodedLocation: any = $state(
		event?.geocoded_location ? JSON.parse(event?.geocoded_location) : ''
	); // State for geocoded location
	let details: string = $state(event?.description ?? ''); // State for event details
	let startHour = $state(''); // State for hour
	let startMinute = $state(''); // State for minute
	let ampmStart = $state('PM'); // State for AM/PM
	let endHour = $state(''); // State for hour
	let endMinute = $state(''); // State for minute
	let ampmEnd: string = $state('PM'); // State for AM/PM
	let maxCapacity: number | null = $state(event?.max_capacity ?? defaultMaxEventCapacity);
	let maxNumGuest: number | null = $state(
		event?.max_num_guests_per_attendee ?? defaultMaxNumGuestsPerAttendee
	);
	let latitude: number | null = $state(event?.latitude);
	let longitude: number | null = $state(event?.longitude);

	// ✅ State Variables
	let client: TriplitClient;
	let eventId = $state(event?.id);
	let cancelUrl = $state(event && event.id ? `/bonfire/${event.id}` : '/');
	let timezone = $state({});
	let setEndTime = $state(false);

	let isEventSaving = $state(false);
	let errorMessage = $state('');
	let showError = $state(false);
	let eventCreated = $state(mode == EventFormType.CREATE ? false : true);

	// Make sure event actually exists before enabling any BE processing
	let submitDisabled = $derived(
		!(dateValue && eventName.length > 0 && startHour.length > 0) || !event || isEventSaving
	);

	let defaultBackground = getNextTheme();
	let defaultFont: FontSelection = getNextFont();

	let finalStyleCss: string = $state(event?.style ?? defaultBackground);
	let overlayColor: string = $state(event?.overlay_color ?? '#000000');
	let overlayOpacity: number = $state(event?.overlay_opacity ?? 0.4);
	let font: FontSelection | null = $state(event?.font ? JSON.parse(event?.font) : defaultFont);

	let eventStartDatetime: Date | null = $state(null);
	let eventEndDatetime: Date | null = $state(null);

	let numLogs = $state(0);
	let numLogsLoading = $state(true);
	let isEventCreated = $state(mode == EventFormType.UPDATE || false);
	// TODO: support events created before payments system was created. There was no concept of "published"/"draft". Remove once all events have an attached transaction.
	let isEventPublished = $derived(event && event.is_published);
	let userIsOutOfLogs = $derived(!numLogsLoading && numLogs == 0 && event && !event.isPublished);
	let userFavoriteNonProfitId = $state(null);

	const getRandomTheme = () => {
		finalStyleCss = getNextTheme();
	};

	const getRandomFont = () => {
		font = getNextFont();
	};

	$effect(() => {
		console.log('userFavoriteNonProfitId', userFavoriteNonProfitId);
	});

	// Build eventStartDatetime dynamically
	$effect(() => {
		if (dateValue && startHour) {
			// Convert DateValue to a JS Date object for the event date
			const date = dateValue?.toDate();

			// Default startMinute to "00" if not provided
			const startMinutes = startMinute ? parseInt(startMinute) : 0;

			// Convert the hour to 24-hour format based on AM/PM for start time
			const startHours = (parseInt(startHour) % 12) + (ampmStart === 'PM' ? 12 : 0);

			// Set hours and minutes based on user input for start time
			date.setHours(startHours, startMinutes, 0, 0);

			// Convert the event date-time to the specified timezone for start time
			eventStartDatetime = new Date(date.toLocaleString('en-US', { timeZone: timezone.value }));
		}
	});

	// Build eventEndDatetime dynamically
	$effect(() => {
		if (dateValue && setEndTime) {
			// Convert DateValue to a JS Date object for the event date
			const date = dateValue?.toDate();
			// If end time is set, calculate end datetime
			const endHours = (parseInt(endHour) % 12) + (ampmEnd === 'PM' ? 12 : 0);
			const endMinutes = endMinute ? parseInt(endMinute) : 0;

			// Create a new Date object for end time, based on the same date
			const endDate = new Date(date);
			endDate.setHours(endHours, endMinutes, 0, 0);

			// Check if end time is before start time
			if (endDate < date) {
				errorMessage = 'End time must be after start time';
				showError = true;
				return;
			}

			// Convert the event date-time to the specified timezone for end time
			eventEndDatetime = new Date(endDate.toLocaleString('en-US', { timeZone: timezone.value }));
		}
	});

	$effect(() => {
		if (!eventCreated && eventName && eventStartDatetime) {
			createEvent(false);
		}
	});

	// NOTE: this is a hack and I dont like it. The way to go is refactor the code in EventStyler so it's reusable.
	$effect(() => {
		const fontStyle = font ? font.style : '';

		// Add the font CDN link to the document head if a font is selected
		if (font && font.cdn) {
			const fontLink = document.createElement('link');
			fontLink.href = font.cdn;
			fontLink.rel = 'stylesheet';
			document.head.appendChild(fontLink);
		}

		if (finalStyleCss) {
			// Replace the placeholder selector with the actual target
			const completeCss = `
				.bg-color-selector {
					${finalStyleCss}
					${fontStyle}
				}

				.bg-overlay-selector {
						background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});
					}
				`;

			// console.log('applying css', completeCss);

			// Create a new <style> tag for the selected preview style
			const styleElement = document.createElement('style');
			styleElement.type = 'text/css';
			styleElement.textContent = completeCss;
			document.head.appendChild(styleElement);
		}
	});

	if (event) {
		const startTime = parseDateTime(event.start_time);
		startHour = startTime.hour;
		startMinute = startTime.minute;
		ampmStart = startTime.ampm;
		dateValue = startTime.dateValue;

		if (event.end_time) {
			const endTime = parseDateTime(event.end_time);
			endHour = endTime.hour;
			endMinute = endTime.minute;
			ampmEnd = endTime.ampm;
			setEndTime = true;
		}
	}

	function parseDateTime(isoString: string) {
		// Create a Date object from the ISO string
		const date = new Date(isoString);

		// Extract hour and minute
		let hours = date.getHours();
		const minutes = date.getMinutes();

		// Determine AM or PM
		const ampm = hours >= 12 ? 'PM' : 'AM';

		// Convert to 12-hour format
		hours = hours % 12 || 12; // Converts 0 to 12 for midnight

		// Create a DateValue using CalendarDate
		const dateValue: DateValue = new CalendarDate(
			date.getFullYear(),
			date.getMonth() + 1, // JS months are zero-based
			date.getDate()
		);

		// Return the parsed values
		return {
			hour: String(hours).padStart(2, '0'), // Ensure 2-digit format
			minute: String(minutes).padStart(2, '0'), // Ensure 2-digit format
			ampm,
			dateValue
		};
	}

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	export async function createBonfireTransaction(eventId: string) {
		if (isEventSaving) {
			await sleep(1000); // Sleep for 1 second (1000 ms)
		}

		isEventSaving = true;
		if (isEventPublished) {
			throw new Error('event is already published, cannot publish again');
		}
		try {
			const response = await fetch('/profile/logs/spend', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ event_id: eventId })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to create transaction');
			}
			notifyBonfirePublished();
			return data.event; // Return the transaction if needed
		} catch (error) {
			console.error('Error creating transaction:', error);
			throw error;
		} finally {
			isEventSaving = false;
		}
	}

	function generateSecureId(length = 12) {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		const charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % charactersLength);
		}
		return result;
	}

	const createEvent = async (createTransaction = false) => {
		if (isEventSaving) {
			return;
		}
		isEventSaving = true;
		const feHttpClient = getFeHttpTriplitClient($page.data.jwt);
		try {
			eventCreated = true;

			const userId: string = (await waitForUserId()) as string;
			if (!userId) {
				errorMessage = 'User authentication failed';
				showError = true;
				return;
			}
			eventId = await generateSecureId(20);

			const eventData = {
				id: eventId,
				title: eventName || '',
				description: details || '',
				location: location || '',
				geocoded_location: JSON.stringify(geocodedLocation) || null,
				start_time: eventStartDatetime,
				end_time: eventEndDatetime,
				user_id: userId,
				style: finalStyleCss || '',
				overlay_color: overlayColor || '#000000',
				overlay_opacity: overlayOpacity || 0.4,
				font: JSON.stringify(font) || null,
				max_capacity: maxCapacity || null,
				max_num_guests_per_attendee: maxNumGuest || 0,
				non_profit_id: userFavoriteNonProfitId || null,
				latitude: latitude,
				longitude: longitude
			};
			console.log('🔍 Event Data being sent to insert:', JSON.stringify(eventData, null, 2));

			event = await feHttpClient.insert('events', eventData);

			// Create a transaction if the user has enough logs remaining
			if (checkCanCreateTransaction(userIsOutOfLogs, createTransaction, isEventPublished)) {
				event = await createBonfireTransaction(eventId);
			}
			if (!createTransaction) {
				toast.success('An event draft was created! 🚀 Publish it when you’re ready.', {
					duration: 4000
				});
			}
			// Add user as attendee
			await upsertUserAttendance(eventId, Status.GOING, 0);
			isEventCreated = true;
			console.log('✅ Event created successfully');
		} catch (error) {
			eventCreated = false;
			console.error('❌ Error creating event:', error);
		} finally {
			isEventSaving = false;
		}
	};

	const updateEvent = async (createTransaction = false, publishEventNow = null) => {
		try {
			const feHttpClient = getFeHttpTriplitClient($page.data.jwt);
			await feHttpClient.update('events', event.id, async (entity) => {
				entity.title = eventName;
				entity.description = details || null;
				entity.location = location;
				entity.geocoded_location = JSON.stringify(geocodedLocation) || null;
				entity.start_time = eventStartDatetime?.toISOString();
				entity.end_time = eventEndDatetime?.toISOString();
				entity.style = finalStyleCss;
				entity.overlay_color = overlayColor;
				entity.overlay_opacity = overlayOpacity;
				entity.font = JSON.stringify(font) || null;
				entity.max_capacity = maxCapacity;
				entity.max_num_guests_per_attendee = maxNumGuest || 0;
				entity.latitude = latitude;
				entity.longitude = longitude;
				entity.is_published = publishEventNow ?? isEventPublished;
			});

			if (checkCanCreateTransaction(userIsOutOfLogs, createTransaction, isEventPublished)) {
				event = await createBonfireTransaction(eventId);
			}
			console.log('🔄 Event updated successfully');
		} catch (error) {
			console.error('❌ Error updating event:', error);
		}
	};

	const checkCanCreateTransaction = (
		userIsOutOfLogs: boolean,
		createTransaction: boolean,
		isEventPublished: boolean
	) => {
		return !userIsOutOfLogs && createTransaction && !isEventPublished;
	};

	const debouncedUpdateEvent = debounce(async () => {
		if (!eventId) return;
		await updateEvent();
	}, 800); // Debounce delay: 800ms

	const redirectToDashboard = () => {
		// Set the stores so the event page updates with new style
		styleStore.set(finalStyleCss);
		overlayColorStore.set(overlayColor);
		overlayOpacityStore.set(overlayOpacity);
		fontStore.set(font);

		if (!event || eventId) {
			goto(`/dashboard`);
		}

		goto(`/bonfire/${eventId}`);
	};

	const handleSubmit = async (e: Event, isPublished = false) => {
		try {
			errorMessage = '';
			showError = false;
			isEventSaving = true;
			e.preventDefault();

			// Ensure basic validation
			if (!dateValue || !eventName) {
				errorMessage = 'Please fill in all required fields';
				showError = true;
				return;
			}

			const userId: string = (await waitForUserId()) as string;
			if (!userId) {
				errorMessage = 'User authentication failed';
				showError = true;
				return;
			}

			if (mode == EventFormType.CREATE && !eventCreated) {
				await createEvent(true).then(() => {
					redirectToDashboard();
				});
			} else {
				await updateEvent(true, isPublished).then(() => {
					redirectToDashboard();
				});
			}
		} catch (e) {
			console.error(`Failed to ${mode === EventFormType.CREATE ? 'create' : 'update'} event`, e);
			errorMessage = `Failed to ${mode === EventFormType.CREATE ? 'create' : 'update'} event. Please try again.`;
			showError = true;
		} finally {
			isEventSaving = false;
		}
	};

	const notifyBonfirePublished = () => {
		toast.success(
			'Your bonfire is live! 🔥 1 log has been used to host it. If you delete it, the log will be lost forever. Instead, edit this bonfire to make changes.',
			{
				duration: 10000
			}
		);
	};

	function capitalize(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	onMount(() => {
		styleStore.set(finalStyleCss);
		overlayColorStore.set(overlayColor);
		overlayOpacityStore.set(overlayOpacity);
		fontStore.set(font);

		(async () => {
			// NOTE: for testing
			console.log('generatePassphraseId()', await generatePassphraseId());
		})();
	});

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserLogsQuery = client.subscribe(
			client.query('user').Where(['id', '=', $page.data.user.id]).Include('user_log_tokens'),
			(results) => {
				console.log('logs query', results);
				if (results && results.length > 0) {
					numLogs = results[0].user_log_tokens?.num_logs ?? 0;
					userFavoriteNonProfitId = results[0].favourite_non_profit_id;
					numLogsLoading = false;
				}
			},
			(error) => {
				console.error('Error fetching user log tokens:', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		return () => {
			unsubscribeFromUserLogsQuery();
		};
	});
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2
			class="mb-2 flex w-full items-center justify-between rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900"
		>
			<BackButton url={eventId ? `/bonfire/${eventId}` : '/dashboard'} />
			<div>
				{mode === EventFormType.CREATE
					? capitalize(EventFormType.CREATE)
					: capitalize(EventFormType.UPDATE)} a Bonfire
			</div>
			<div></div>
		</h2>
		<Tabs.Root value="info" class="w-full">
			<div class="sticky top-2 z-50 mt-7 flex w-full justify-center">
				<div>
					<Tabs.List class="mb-1 w-full animate-in fade-in zoom-in">
						<Tabs.Trigger
							id="event-info-tab"
							value="info"
							class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-cyan-500 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600"
							><Info class="h-5 w-5" /></Tabs.Trigger
						>
						<Tabs.Trigger
							id="event-styles-tab"
							value="styles"
							class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-cyan-500 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600"
							><Palette class="h-5 w-5" /></Tabs.Trigger
						>
						<Tabs.Trigger
							id="event-admins-tab"
							value="admins"
							class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-cyan-500 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600"
							><Shield class="h-5 w-5" /></Tabs.Trigger
						>
						<Tabs.Trigger
							id="event-reminders-tab"
							value="reminders"
							class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-cyan-500 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600"
							><BellRing class="h-5 w-5" /></Tabs.Trigger
						>
					</Tabs.List>
				</div>
			</div>

			<Tabs.Content value="info">
				<form class="space-y-2">
					{#if userIsOutOfLogs && !isEventPublished}
						<OutOfLogs />
					{:else if !isEventPublished}
						<div class="flex justify-center">
							<div
								class="rounded-lg bg-slate-300 bg-opacity-70 p-1 px-2 text-xs shadow-lg dark:bg-slate-600 dark:bg-opacity-70"
							>
								You have

								{#if numLogsLoading}
									<LoadingSpinner cls="w-3 h-3 mx-1" />
								{:else}
									{numLogs}
								{/if}
								logs remaining (1 log = 1 bonfire event)
							</div>
						</div>
					{/if}
					<div class="mt-3 flex w-full justify-center space-x-2 text-xs">
						<Button
							class="justify-centerp-4 flex items-center bg-violet-600 ring-glow hover:bg-violet-500 dark:bg-violet-700 dark:text-white dark:hover:bg-violet-500"
							onclick={getRandomTheme}
						>
							<PaintBucket class="mr-1" />
							<RefreshCw class="mr-1" />
						</Button>
						<Button
							class="flex items-center justify-center bg-violet-600 p-4 ring-glow hover:bg-violet-500 dark:bg-violet-700 dark:text-white dark:hover:bg-violet-500"
							onclick={getRandomFont}
						>
							<TypeOutline class="mr-1" />
							<RefreshCw class="mr-1" />
						</Button>
					</div>
					<Input
						type="text"
						placeholder="Event Name"
						bind:value={eventName}
						class="w-full bg-white dark:bg-slate-900"
						oninput={debouncedUpdateEvent}
					/>
					<Datepicker bind:value={dateValue} oninput={debouncedUpdateEvent} />

					<div class="flex flex-row items-center justify-between space-x-4">
						<!-- Start Time Inputs -->
						<div class="grid grid-cols-4 items-center gap-2">
							<Clock
								class="ml-4 mr-1 h-4 w-4 rounded-xl bg-white text-slate-500 ring-glow dark:bg-slate-900"
							/>
							<div class="font-mono">
								<DoubleDigitsPicker
									maxValue={12}
									bind:value={startHour}
									placeholder="HH"
									oninput={debouncedUpdateEvent}
								/>
							</div>
							<div class="font-mono">
								<DoubleDigitsPicker
									bind:value={startMinute}
									placeholder="mm"
									oninput={debouncedUpdateEvent}
								/>
							</div>
							<div class="w-18">
								<AmPmPicker
									onValueChange={(newValue: any) => (ampmStart = newValue)}
									oninput={debouncedUpdateEvent}
								/>
							</div>
						</div>

						<!-- Toggle Button -->
						{#if !setEndTime}
							<Button
								onclick={() => {
									setEndTime = true;
								}}
								class="text-xs ring-glow dark:bg-slate-900 dark:text-white"
							>
								<Plus class="ml-1 mr-1 h-2 w-2" />
								to
							</Button>
						{:else}
							<Button
								onclick={() => {
									setEndTime = false;
									endHour = '';
									endMinute = '';
									ampmEnd = '';
								}}
								class="text-xs ring-glow dark:bg-slate-900 dark:text-white"
							>
								<Minus class="h-2 w-2" />
								to
							</Button>
						{/if}
					</div>

					{#if setEndTime}
						<div class="flex flex-row items-center justify-between space-x-4">
							<!-- End Time Inputs -->
							<div class="grid grid-cols-4 items-center gap-2">
								<Clock8
									class="ml-4 mr-1 h-4 w-4 rounded-xl bg-white text-slate-500 ring-glow dark:bg-slate-900"
								/>

								<div class="font-mono">
									<DoubleDigitsPicker
										maxValue={12}
										bind:value={endHour}
										placeholder="HH"
										oninput={debouncedUpdateEvent}
									/>
								</div>
								<div class="font-mono">
									<DoubleDigitsPicker
										bind:value={endMinute}
										placeholder="mm"
										oninput={debouncedUpdateEvent}
									/>
								</div>
								<div class="w-18">
									<AmPmPicker
										onValueChange={(newValue: any) => (ampmEnd = newValue)}
										oninput={debouncedUpdateEvent}
									/>
								</div>
							</div>

							<!-- Toggle Button -->

							<Button class="hidden text-xs ring-glow"></Button>
						</div>
					{/if}

					<TimezonePicker
						onValueChange={(newValue: any) => (timezone = newValue)}
						oninput={debouncedUpdateEvent}
					/>

					<div class="flex flex-row items-center">
						<LocationInput
							bind:location
							bind:geocodedLocation
							bind:latitude
							bind:longitude
							onSave={debouncedUpdateEvent}
						/>
					</div>
					<!-- <TextAreaAutoGrow
							cls={'bg-white dark:bg-slate-900'}
							placeholder="Details"
							bind:value={details}
							oninput={debouncedUpdateEvent}
						/> -->
					<TipTapTextEditor
						bind:content={details}
						oninput={debouncedUpdateEvent}
						class="bg-white dark:bg-slate-900 "
					/>
					<MaxCapacity oninput={debouncedUpdateEvent} bind:value={maxCapacity} />
					<GuestCountFeature oninput={debouncedUpdateEvent} bind:value={maxNumGuest} />
				</form>
				<div class="my-10 sm:w-[450px]">
					<div class="grid w-full grid-cols-2 gap-2">
						<a class="flex w-full" href={cancelUrl}>
							<Button
								class="w-full ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-700"
							>
								<Undo2 class="ml-1 mr-1 h-4 w-4" /> Cancel
							</Button>
						</a>

						{#if isEventCreated && !isEventPublished}
							<Button
								disabled={submitDisabled}
								type="submit"
								class={`w-full ${submitDisabled ? 'bg-slate-400 dark:bg-slate-600' : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600'} ring-glow dark:text-white`}
								onclick={() => {
									updateEvent().then(() => {
										redirectToDashboard();
									});
								}}
							>
								<ArrowDownToLine class="ml-1 mr-1 h-4 w-4" />Save Draft
							</Button>
						{/if}
						{#if !userIsOutOfLogs || isEventPublished}
							<Button
								id="upsert-bonfire"
								disabled={submitDisabled}
								type="submit"
								class={`w-full ${submitDisabled ? 'bg-slate-400 dark:bg-slate-600' : 'bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600'} ring-glow dark:text-white`}
								onclick={(e) => {
									handleSubmit(e, true);
								}}
							>
								{#if isEventSaving}
									<span class="loading loading-spinner loading-xs ml-2"> </span>
								{/if}
								{#if isEventPublished}
									<Save class="ml-1 mr-1 h-4 w-4" />
									Save
								{:else}
									<BookCheck class="ml-1 mr-1 h-4 w-4" />
									Publish
								{/if}
							</Button>
						{/if}
						{#if isEventPublished}
							<UnpublishEventBtn {submitDisabled} eventId={event.id} />
						{/if}
						{#if mode == EventFormType.UPDATE && event && currUserId == event.user_id}
							<DeleteEventBtn
								{submitDisabled}
								{currUserId}
								eventCreatorUserId={event.user_id}
								eventId={event.id}
							/>
						{/if}
					</div>
				</div>
			</Tabs.Content>
			<Tabs.Content value="styles">
				<EventStyler {eventId} bind:finalStyleCss bind:overlayColor bind:overlayOpacity bind:font />
			</Tabs.Content>
			<Tabs.Content value="admins">
				<EventAdminEditor eventId={event?.id} {currUserId} eventCreatorId={event?.user_id} />
			</Tabs.Content>
			<Tabs.Content value="reminders">
				<EventReminders />
			</Tabs.Content>
		</Tabs.Root>
	</section>

	{#if showError}
		<div class="mt-2 rounded-md bg-red-100 p-3 text-red-700">
			{errorMessage}
		</div>
	{/if}
</div>
