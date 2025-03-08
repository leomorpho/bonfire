<script lang="ts">
	import EventStyler from './EventStyler.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Plus,
		Minus,
		Clock,
		Clock8,
		ArrowDownToLine,
		Trash2,
		Palette,
		Shield,
		BookCheck
	} from 'lucide-svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import {
		getFeHttpTriplitClient,
		getFeWorkerTriplitClient,
		upsertUserAttendance,
		waitForUserId
	} from '$lib/triplit';
	import { goto } from '$app/navigation';
	import type { TriplitClient } from '@triplit/client';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { EventFormType, Status } from '$lib/enums';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		overlayColorStore,
		overlayOpacityStore,
		parseColor,
		stylesGallery,
		styleStore,
		randomSort
	} from '$lib/styles';
	import { generatePassphraseId } from '$lib/utils';
	import TextAreaAutoGrow from './TextAreaAutoGrow.svelte';
	import ChevronLeft from 'svelte-radix/ChevronLeft.svelte';
	import LocationInput from './input/location/LocationInput.svelte';
	import EventAdminEditor from './EventAdminEditor.svelte';
	import { debounce } from 'lodash-es';
	import MaxCapacity from './eventform/MaxCapacity.svelte';
	import BackButton from './BackButton.svelte';
	import OutOfLogs from './payments/OutOfLogs.svelte';
	import { toast } from 'svelte-sonner';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { env as publicEnv } from '$env/dynamic/public';

	let { mode, event = null, currUserId = null } = $props();

	const editingMainEvent = 'editing_main_event';
	const editingStyles = 'editing_styles';
	const editingAdmins = 'editing_admins';

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
	let maxCapacity: number | null = $state(event?.max_capacity);
	let latitude: number | null = $state(event?.latitude);
	let longitude: number | null = $state(event?.longitude);

	// ✅ State Variables
	let client: TriplitClient;
	let eventId = $state(event?.id);
	let currentEventEditingMode = $state(editingMainEvent);
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

	const defaultBackground = randomSort(stylesGallery)[0].cssTemplate;
	console.log('defaultBackground', defaultBackground);
	let finalStyleCss: string = $state(event?.style ?? defaultBackground);
	let overlayColor: string = $state(event?.overlay_color ?? '#000000');
	let overlayOpacity: number = $state(event?.overlay_opacity ?? 0.4);

	let eventStartDatetime: Date | null = $state(null);
	let eventEndDatetime: Date | null = $state(null);

	let numLogs = $state(0);
	let numLogsLoading = $state(true);
	let isEventCreated = $state(mode == EventFormType.UPDATE || false);
	// TODO: support events created before payments system was created. There was no concept of "published"/"draft". Remove once all events have an attached transaction.
	let isEventPublished = $derived(event && event.is_published);
	let userIsOutOfLogs = $derived(!numLogsLoading && numLogs == 0 && !event.isPublished);
	let userFavoriteNonProfitId = $state(null);

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
		if (finalStyleCss) {
			// Replace the placeholder selector with the actual target
			const completeCss = `
		.bg-color-selector {
			${finalStyleCss}
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
			eventId = await generatePassphraseId('', 48);

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
				max_capacity: maxCapacity || null,
				non_profit_id: userFavoriteNonProfitId || null,
				latitude: latitude,
				longitude: longitude
			};
			console.log('🔍 Event Data being sent to insert:', JSON.stringify(eventData, null, 2));

			const { output } = await feHttpClient.insert('events', eventData);
			event = output;

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
			await upsertUserAttendance(eventId, Status.GOING);
			isEventCreated = true;
			console.log('✅ Event created successfully');
		} catch (error) {
			eventCreated = false;
			console.error('❌ Error creating event:', error);
		} finally {
			isEventSaving = false;
		}
	};

	const updateEvent = async (createTransaction = false) => {
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
				entity.max_capacity = maxCapacity;
				entity.latitude = latitude;
				entity.longitude = longitude;
			});
			console.log('UPDATING', latitude, longitude);

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

		if (!event || eventId) {
			goto(`/dashboard`);
		}

		goto(`/bonfire/${eventId}`);
	};

	const handleSubmit = async (e: Event) => {
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
				await updateEvent(true).then(() => {
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

	const deleteEvent = async (e: Event) => {
		try {
			const userId: string = (await waitForUserId()) as string;
			client
				.delete('events', event.id)
				.then(() => {
					console.log('Event deleted:', event.id);
					goto('/dashboard');
				})
				.catch((error: any) => {
					console.error('Error deleting event:', error);
				});
		} catch (error) {
			console.error('Error deleting event:', error);
		}
	};

	const startEditEventStyle = () => {
		currentEventEditingMode = editingStyles;
	};
	const stopEditEventStyle = () => {
		currentEventEditingMode = editingMainEvent;
	};

	const startEditAdmins = () => {
		currentEventEditingMode = editingAdmins;
	};
	const stopEditAdmins = () => {
		currentEventEditingMode = editingMainEvent;
	};

	function capitalize(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	onMount(() => {
		styleStore.set(finalStyleCss);
		overlayColorStore.set(overlayColor);
		overlayOpacityStore.set(overlayOpacity);

		(async () => {
			// NOTE: for testing
			console.log('generatePassphraseId()', await generatePassphraseId());
		})();
	});

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserLogsQuery = client.subscribe(
			client
				.query('user')
				.where(['id', '=', $page.data.user.id])
				.include('user_log_tokens')
				.build(),
			(results) => {
				console.log('results', results);
				console.log('results[0].favourite_non_profit_id', results[0].favourite_non_profit_id);
				if (results[0].user_log_tokens) {
					numLogs = results[0].user_log_tokens.num_logs;
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
	{#if currentEventEditingMode == editingMainEvent}
		<section class="mt-8 w-full sm:w-[450px]">
			<h2
				class="mb-2 flex w-full items-center justify-between rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900"
			>
				<BackButton url={`/bonfire/${eventId}`} />
				<div>
					{mode === EventFormType.CREATE
						? capitalize(EventFormType.CREATE)
						: capitalize(EventFormType.UPDATE)} a Bonfire
				</div>
				<div></div>
			</h2>
			<form class="space-y-2">
				{#if userIsOutOfLogs}
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
				<TextAreaAutoGrow
					cls={'bg-white dark:bg-slate-900 dark:bg-slate-900'}
					placeholder="Details"
					bind:value={details}
					oninput={debouncedUpdateEvent}
				/>
				<MaxCapacity oninput={debouncedUpdateEvent} bind:value={maxCapacity} />
			</form>

			<div class="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
				<Button
					class="justify-centerp-4 flex items-center ring-glow dark:bg-slate-700 dark:text-white dark:hover:bg-slate-500"
					onclick={startEditEventStyle}
				>
					<Palette class="mr-1" />
					Edit event style
				</Button>
				<Button
					class="flex items-center justify-center p-4 ring-glow dark:bg-slate-700 dark:text-white dark:hover:bg-slate-500"
					disabled={!event || event?.user_id != currUserId}
					onclick={startEditAdmins}
				>
					<Shield class="mr-1" />
					Edit admins
				</Button>
			</div>
		</section>
		<div class="my-10 w-full sm:w-[450px]">
			<a href={cancelUrl}>
				<Button
					class="sticky top-2 mt-2 w-full ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-700"
					>Cancel</Button
				>
			</a>
			{#if isEventCreated && !isEventPublished}
				<Button
					disabled={submitDisabled}
					type="submit"
					class={`sticky top-2 mt-2 w-full ${submitDisabled ? 'bg-slate-400 dark:bg-slate-600' : 'bg-blue-500 hover:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600'} ring-glow dark:text-white`}
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
					class={`sticky top-2 mt-2 w-full ${submitDisabled ? 'bg-slate-400 dark:bg-slate-600' : 'bg-green-500 hover:bg-green-400 dark:bg-green-700 dark:hover:bg-green-600'} ring-glow dark:text-white`}
					onclick={handleSubmit}
				>
					{#if isEventSaving}
						<span class="loading loading-spinner loading-xs ml-2"> </span>
					{/if}
					<BookCheck class="ml-1 mr-1 h-4 w-4" /> Publish
				</Button>
			{/if}
			{#if mode == EventFormType.UPDATE && event && currUserId == event.user_id}
				<Dialog.Root>
					<Dialog.Trigger class="w-full" disabled={submitDisabled || currUserId != event.user_id}
						><Button
							disabled={submitDisabled || currUserId != event.user_id}
							class="mt-2 w-full bg-red-500 ring-glow hover:bg-red-400 dark:bg-red-700 dark:text-white dark:hover:bg-red-600"
						>
							<Trash2 class="ml-1 mr-1 h-4 w-4" /> Delete
						</Button></Dialog.Trigger
					>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
							<Dialog.Description>
								Once deleted, this bonfire is gone forever 🔥. This action <span class="font-bold"
									>cannot</span
								>
								be undone, and you <span class="font-bold">won’t get back</span> the log token used
								to create it. If you just need changes, consider
								<span class="font-bold">editting</span> instead.
							</Dialog.Description>
						</Dialog.Header>
						<Dialog.Footer
							><Button
								disabled={submitDisabled}
								class="mt-2 w-full bg-red-500 hover:bg-red-400"
								onclick={deleteEvent}
							>
								<Trash2 class="ml-1 mr-1 h-4 w-4" /> Crush it
							</Button></Dialog.Footer
						>
					</Dialog.Content>
				</Dialog.Root>
			{/if}
		</div>
	{:else if currentEventEditingMode == editingStyles}
		<div class="md:7/8 w-5/6">
			<div class="sticky top-2 mt-2 flex justify-center">
				<Button
					class="w-full bg-violet-500 ring-glow hover:bg-violet-400 dark:bg-violet-700 dark:text-white dark:hover:bg-violet-600 sm:w-[450px]"
					onclick={stopEditEventStyle}
				>
					<ChevronLeft class="mr-1" />

					Back
				</Button>
			</div>

			<EventStyler bind:finalStyleCss bind:overlayColor bind:overlayOpacity />
		</div>
	{:else if currentEventEditingMode == editingAdmins}
		<div class="md:7/8 w-5/6">
			<div class="sticky top-2 mt-2 flex justify-center">
				<Button
					class="w-full bg-violet-500 ring-glow hover:bg-violet-400 dark:bg-violet-700 dark:text-white dark:hover:bg-violet-600 sm:w-[450px]"
					onclick={stopEditAdmins}
				>
					<ChevronLeft class="mr-1" />

					Back
				</Button>
			</div>
			<EventAdminEditor eventId={event?.id} {currUserId} eventCreatorId={event?.user_id} />
		</div>
	{/if}
	{#if showError}
		<div class="mt-2 rounded-md bg-red-100 p-3 text-red-700">
			{errorMessage}
		</div>
	{/if}
</div>
