<script lang="ts">
	import { BonfireEditingTabs, defaultMaxNumGuestsPerAttendee } from '$lib/enums';
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
		Save
	} from 'lucide-svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { goto } from '$app/navigation';
	import type { TriplitClient } from '@triplit/client';
	import { defaultMaxEventCapacity, EventFormType, Status } from '$lib/enums';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		overlayColorStore,
		overlayOpacityStore,
		styleStore,
		fontStore,
		getNextTheme,
		getNextFont,
		Font
	} from '$lib/styles';
	import { generatePassphraseId } from '$lib/utils';
	import LocationInput from '../input/location/LocationInput.svelte';
	import EventAdminEditor from '../EventAdminEditor.svelte';
	import { debounce } from 'lodash-es';
	import BackButton from '../BackButton.svelte';
	import { toast } from 'svelte-sonner';
	import UnpublishEventBtn from './buttons/UnpublishEventBtn.svelte';
	import CancelEventBtn from './buttons/CancelEventBtn.svelte';
	import DeleteEventBtn from './buttons/DeleteEventBtn.svelte';
	import TipTapTextEditor from '../input/tiptap/TipTapTextEditor.svelte';
	import MaxCapacity from './feature-enablers/MaxCapacity.svelte';
	import GuestCountFeature from './feature-enablers/GuestCountFeature.svelte';
	import TicketingFeature from './feature-enablers/TicketingFeature.svelte';
	import TicketTypeManager from '../tickets/TicketTypeManager.svelte';
	import CurrencySelector from './feature-enablers/CurrencySelector.svelte';
	import {
		createEvent as createEventShared,
		updateEvent as updateEventShared,
		triggerUpdateReminders,
		type CreateEventData,
		type UpdateEventData
	} from '$lib/event-operations';
	import type { FontSelection } from '$lib/types';
	import {
		BellRing,
		Info,
		PaintBucket,
		RefreshCw,
		TypeOutline,
		Ticket,
		CircleAlert
	} from '@lucide/svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { ALLOWED_EVENT_CURRENCIES } from '$lib/enums';
	import EventReminders from './reminders/EventReminders.svelte';
	import RequiredBringItemForAttendance from './feature-enablers/RequiredBringItemForAttendance.svelte';
	import BetaDevAlert from '../BetaDevAlert.svelte';
	import ToggleBringList from './feature-enablers/ToggleBringList.svelte';
	import { fade, slide } from 'svelte/transition';
	import ToggleGallery from './feature-enablers/ToggleGallery.svelte';
	import ToggleMessaging from './feature-enablers/ToggleMessaging.svelte';
	import ToggleCuttoffRsvpDate from './feature-enablers/ToggleCuttoffRsvpDate.svelte';
	import { getUserOrganizations } from '$lib/organizations';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Building2, ExternalLink } from 'lucide-svelte';

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
	let isBringListEnabled: boolean = $state(event?.is_bring_list_enabled ?? false);
	let isGalleryEnabled: boolean = $state(event?.is_gallery_enabled ?? true);
	let isMessagingEnabled: boolean = $state(event?.is_messaging_enabled ?? true);
	let requireGuestBringItem: boolean = $state(event?.require_guest_bring_item ?? false);
	let isCuttoffDateEnabled: boolean = $state(event?.is_cut_off_date_enabled ?? false);
	let cuttoffDate = $state(event?.cut_off_date);
	let latitude: number | null = $state(event?.latitude);
	let longitude: number | null = $state(event?.longitude);
	let selectedOrganizationId: string | null = $state(event?.organization_id ?? null);
	let isTicketed: boolean = $state(event?.is_ticketed ?? false);
	let maxTicketsPerUser: number = $state(event?.max_tickets_per_user ?? 5);
	let ticketCurrency: string = $state(event?.ticket_currency ?? 'usd');
	let userOrganizations: any[] = $state([]);
	let organizationsLoading = $state(false);
	let organizationModalOpen = $state(false);
	let ticketTypes: any[] = $state([]);
	let hasTicketsSold = $state(false);

	// ✅ State Variables
	let client: TriplitClient;
	let eventId = $state(event?.id);
	let timezone = $state({});
	let setEndTime = $state(false);

	let isEventSaving = $state(false);
	let errorMessage = $state('');
	let showError = $state(false);
	let eventCreated = $state(mode == EventFormType.CREATE ? false : true);
	let showIncompleteTicketWarning = $state(false);
	let incompleteTicketWarningMessage = $state('');

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

	let needToUpdateReminderDates: boolean = $state(false);
	let eventStartDatetime: Date | null = $state(null);
	let eventEndDatetime: Date | null = $state(null);

	// Reactive effect: When ticketing is enabled, guests should be disabled
	$effect(() => {
		if (isTicketed) {
			maxNumGuest = 0;
			// Ensure valid currency
			if (!ALLOWED_EVENT_CURRENCIES.includes(ticketCurrency)) {
				ticketCurrency = 'usd';
			}
		}

		// Reset ticketing if event is not created
		if (!eventCreated && isTicketed) {
			isTicketed = false;
		}
	});

	// Load ticket types when event is ticketed and created
	$effect(() => {
		if (isTicketed && eventCreated && eventId) {
			loadTicketTypes();
		}
	});

	async function loadTicketTypes() {
		if (!eventId) return;

		try {
			const response = await fetch(`/api/tickets/types?eventId=${eventId}`);
			if (response.ok) {
				const data = await response.json();
				ticketTypes = data.ticketTypes || [];

				// Check if any tickets have been sold by looking at quantity_sold
				hasTicketsSold = ticketTypes.some((ticketType) => (ticketType.quantity_sold || 0) > 0);
			} else {
				console.error('Failed to load ticket types');
			}
		} catch (error) {
			console.error('Error loading ticket types:', error);
		}
	}

	// let numLogs = $state(0);
	// let numLogsLoading = $state(true);
	let isEventCreated = $state(mode == EventFormType.UPDATE || false);
	// TODO: support events created before payments system was created. There was no concept of "published"/"draft". Remove once all events have an attached transaction.
	let isEventPublished = $derived(event && event.is_published);
	// let userIsOutOfLogs = $derived(!numLogsLoading && numLogs == 0 && event && !event.isPublished);
	// let userFavoriteNonProfitId = $state(null);
	let isEventEdittable = $state(true);

	$effect(() => {
		if (event && event.start_time && isEventCreated) {
			isEventEdittable = new Date() < event.start_time;
		}
	});

	const getRandomTheme = () => {
		finalStyleCss = getNextTheme();
	};

	const getRandomFont = () => {
		font = getNextFont();
	};

	// $effect(() => {
	// 	console.log('userFavoriteNonProfitId', userFavoriteNonProfitId);
	// });

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
		try {
			eventCreated = true;

			const eventData: CreateEventData = {
				title: eventName || '',
				description: details || '',
				location: location || '',
				geocoded_location: geocodedLocation,
				start_time: eventStartDatetime!,
				end_time: eventEndDatetime,
				organization_id: selectedOrganizationId,
				style: finalStyleCss || '',
				overlay_color: overlayColor || '#000000',
				overlay_opacity: overlayOpacity || 0.4,
				font: font,
				max_capacity: maxCapacity,
				max_num_guests_per_attendee: maxNumGuest || 0,
				is_bring_list_enabled: isBringListEnabled || false,
				is_gallery_enabled: isGalleryEnabled,
				is_messaging_enabled: isMessagingEnabled,
				require_guest_bring_item: requireGuestBringItem,
				is_cut_off_date_enabled: isCuttoffDateEnabled,
				cut_off_date: cuttoffDate,
				// Ticketing fields
				is_ticketed: isTicketed || false,
				max_tickets_per_user: isTicketed ? maxTicketsPerUser : null,
				ticket_currency: isTicketed ? ticketCurrency : 'usd',
				latitude: latitude,
				longitude: longitude
			};

			const result = await createEventShared(client, eventData);
			event = result.event;
			eventId = result.eventId;

			// // Create a transaction if the user has enough logs remaining
			// if (checkCanCreateTransaction(userIsOutOfLogs, createTransaction, isEventPublished)) {
			// 	event = await createBonfireTransaction(eventId);
			// }
			// if (!createTransaction) {
			// 	toast.success('An event draft was created! 🚀 Publish it when you’re ready.', {
			// 		duration: 4000
			// 	});
			// }
			isEventCreated = true;
		} catch (error) {
			eventCreated = false;
			console.error('❌ Error creating event:', error);
		} finally {
			isEventSaving = false;
		}
	};

	const updateEvent = async (createTransaction = false, publishEventNow = false) => {
		try {
			const eventData: UpdateEventData = {
				title: eventName,
				description: details || null,
				location: location,
				geocoded_location: geocodedLocation,
				start_time: eventStartDatetime!,
				end_time: eventEndDatetime,
				organization_id: selectedOrganizationId,
				style: finalStyleCss,
				overlay_color: overlayColor,
				overlay_opacity: overlayOpacity,
				font: font,
				max_capacity: maxCapacity,
				max_num_guests_per_attendee: maxNumGuest || 0,
				is_bring_list_enabled: isBringListEnabled || false,
				is_gallery_enabled: isGalleryEnabled,
				is_messaging_enabled: isMessagingEnabled,
				require_guest_bring_item: requireGuestBringItem,
				is_cut_off_date_enabled: isCuttoffDateEnabled,
				cut_off_date: cuttoffDate,
				// Ticketing fields
				is_ticketed: isTicketed || false,
				max_tickets_per_user: isTicketed ? maxTicketsPerUser : null,
				ticket_currency: isTicketed ? ticketCurrency : 'usd',
				latitude: latitude,
				longitude: longitude,
				is_published: isEventPublished || publishEventNow
			};

			await updateEventShared(client, event.id, eventData);

			if (needToUpdateReminderDates) {
				// No need to await for this, leave it in background change
				triggerUpdateReminders(event.id);
				needToUpdateReminderDates = false;
			}

			// if (checkCanCreateTransaction(userIsOutOfLogs, createTransaction, isEventPublished)) {
			// 	event = await createBonfireTransaction(eventId);
			// }
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

			// Additional validation for ticketed events
			if (isTicketed && isPublished) {
				let missingItems = [];

				if (!ticketCurrency || !ALLOWED_EVENT_CURRENCIES.includes(ticketCurrency)) {
					missingItems.push('Select a currency for ticket prices');
				}

				if (ticketTypes.length === 0) {
					missingItems.push('Create at least one ticket type');
				}

				if (missingItems.length > 0) {
					isEventSaving = false;
					incompleteTicketWarningMessage = missingItems.join('\n• ');
					showIncompleteTicketWarning = true;
					return;
				}
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

		// const unsubscribeFromUserLogsQuery = client.subscribe(
		// 	client.query('user').Where(['id', '=', $page.data.user.id]).Include('user_log_tokens'),
		// 	(results) => {
		// 		console.log('logs query', results);
		// 		if (results && results.length > 0) {
		// 			numLogs = results[0].user_log_tokens?.num_logs ?? 0;
		// 			userFavoriteNonProfitId = results[0].favourite_non_profit_id;
		// 			numLogsLoading = false;
		// 		}
		// 	},
		// 	(error) => {
		// 		console.error('Error fetching user log tokens:', error);
		// 	},
		// 	{
		// 		localOnly: false,
		// 		onRemoteFulfilled: () => {}
		// 	}
		// );

		// return () => {
		// 	unsubscribeFromUserLogsQuery();
		// };
	});

	onMount(() => {
		// NOTE: this is a bit of a hack and loads all fonts at once. If we add
		// even more fonts, definitely stop doing that!
		for (const { cdn } of Object.values(Font)) {
			const link = document.createElement('link');
			link.href = cdn;
			link.rel = 'stylesheet';
			document.head.appendChild(link);
		}
	});

	let activeTab: string | BonfireEditingTabs = $state(BonfireEditingTabs.Info);

	// Manage URLs for tabs
	function updateURL(tabName: string): void {
		const url = new URL(window.location.href);
		url.searchParams.set('tab', tabName);
		window.history.pushState({}, '', url);
		activeTab = tabName;
	}

	function loadStepFromURL(): void {
		const urlParams = new URLSearchParams(window.location.search);
		const tabParam = urlParams.get('tab');
		if (tabParam) {
			activeTab = tabParam;
		}
	}

	// Load user's organizations
	const loadUserOrganizations = async () => {
		if (!client) return;

		organizationsLoading = true;
		try {
			const userId = await waitForUserId();
			if (userId) {
				userOrganizations = await getUserOrganizations(client, userId as string);
			}
		} catch (error) {
			console.error('Error loading user organizations:', error);
		} finally {
			organizationsLoading = false;
		}
	};

	onMount(async () => {
		loadStepFromURL();
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		await loadUserOrganizations();
	});
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="w-full px-3 sm:w-[450px] sm:px-0 lg:w-[600px]">
		<Tabs.Root value={activeTab} class="w-full">
			<div class="sticky top-2 z-50 mt-3 flex w-full justify-center">
				<div
					class="mb-2 flex w-full items-center justify-between rounded-xl bg-white p-2 text-lg font-semibold shadow-2xl dark:bg-slate-900"
				>
					<BackButton url={event ? `/bonfire/${event.id}` : '/dashboard'} />

					<Tabs.List class="w-min animate-in fade-in zoom-in dark:bg-slate-700 dark:text-white">
						<Tabs.Trigger
							id="event-info-tab"
							value={BonfireEditingTabs.Info}
							class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-cyan-500 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600"
							onclick={() => updateURL(BonfireEditingTabs.Info)}
							><Info class="h-5 w-5 sm:h-6 sm:w-6" /></Tabs.Trigger
						>
						<Tabs.Trigger
							id="event-styles-tab"
							value={BonfireEditingTabs.Styles}
							class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-cyan-500 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600"
							onclick={() => updateURL(BonfireEditingTabs.Styles)}
							><Palette class="h-5 w-5 sm:h-6 sm:w-6" /></Tabs.Trigger
						>
						<Tabs.Trigger
							id="event-admins-tab"
							value={BonfireEditingTabs.Admins}
							class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-cyan-500 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600"
							onclick={() => updateURL(BonfireEditingTabs.Admins)}
							><Shield class="h-5 w-5 sm:h-6 sm:w-6" /></Tabs.Trigger
						>
						<Tabs.Trigger
							id="event-reminders-tab"
							value={BonfireEditingTabs.Reminders}
							class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-cyan-500 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600"
							onclick={() => updateURL(BonfireEditingTabs.Reminders)}
							><BellRing class="h-5 w-5 sm:h-6 sm:w-6" /></Tabs.Trigger
						>
						{#if isTicketed && eventCreated}
							<Tabs.Trigger
								id="event-tickets-tab"
								value={BonfireEditingTabs.Tickets}
								class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-cyan-500 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600"
								onclick={() => updateURL(BonfireEditingTabs.Tickets)}
								><Ticket class="h-5 w-5 sm:h-6 sm:w-6" /></Tabs.Trigger
							>
						{/if}
					</Tabs.List>
					<div></div>
				</div>
			</div>
			<BetaDevAlert />

			<Tabs.Content value={BonfireEditingTabs.Info}>
				<h1
					class="mb-2 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white"
				>
					General info
				</h1>
				<form class="space-y-2">
					<!-- {#if userIsOutOfLogs && !isEventPublished}
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
					{/if} -->
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

					<!-- Organization Selector -->
					<div class="w-full space-y-2">
						{#if mode === EventFormType.CREATE && userOrganizations.length > 0}
							<Select.Root bind:value={selectedOrganizationId}>
								<Select.Trigger class="w-full bg-white dark:bg-slate-900">
									{#if selectedOrganizationId}
										{userOrganizations.find((org) => org.id === selectedOrganizationId)?.name ||
											'Select organization'}
									{:else}
										Select organization (optional)
									{/if}
								</Select.Trigger>
								<Select.Content class="bg-white dark:bg-slate-900">
									<Select.Group>
										<Select.Item value={null} onclick={debouncedUpdateEvent}>
											<span class="italic text-gray-500">No organization</span>
										</Select.Item>
										{#each userOrganizations as org}
											<Select.Item value={org.id} onclick={debouncedUpdateEvent}>
												<div class="flex w-full items-center justify-between">
													<span>{org.name}</span>
													{#if org.userRole === 'leader' || org.userRole === 'admin'}
														<span class="ml-2 rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
															>Leader</span
														>
													{:else if org.userRole}
														<span class="ml-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
															>{org.userRole}</span
														>
													{/if}
												</div>
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						{:else if mode === EventFormType.UPDATE}
							{#if selectedOrganizationId}
								<div
									class="flex w-full items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-slate-800"
								>
									<div class="flex items-center gap-2">
										<Building2 class="h-4 w-4 text-gray-500" />
										<span class="font-medium">
											{userOrganizations.find((org) => org.id === selectedOrganizationId)?.name ||
												'Unknown Organization'}
										</span>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										class="text-xs"
										onclick={() => (organizationModalOpen = true)}
									>
										Change
									</Button>
								</div>
							{:else}
								<div class="flex justify-center">
									<Button
										type="button"
										variant="outline"
										size="sm"
										class="text-xs"
										onclick={() => (organizationModalOpen = true)}
									>
										<Building2 class="mr-1 h-4 w-4" />
										Link Organization
									</Button>
								</div>
							{/if}
						{/if}

						{#if mode === EventFormType.CREATE}
							<div class="flex justify-center">
								<Button
									type="button"
									variant="outline"
									size="sm"
									class="text-xs"
									onclick={() => goto('/organizations')}
								>
									{userOrganizations.length > 0 ? 'Manage Organizations' : 'Create Organization'}
								</Button>
							</div>
						{/if}
					</div>
					<Datepicker
						disabled={!isEventEdittable}
						bind:value={dateValue}
						oninput={() => {
							debouncedUpdateEvent();
							needToUpdateReminderDates = true;
						}}
					/>

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
									disabled={!isEventEdittable}
								/>
							</div>
							<div class="font-mono">
								<DoubleDigitsPicker
									bind:value={startMinute}
									placeholder="mm"
									oninput={debouncedUpdateEvent}
									disabled={!isEventEdittable}
								/>
							</div>
							<div class="w-18">
								<AmPmPicker
									onValueChange={(newValue: any) => (ampmStart = newValue)}
									oninput={debouncedUpdateEvent}
									disabled={!isEventEdittable}
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
						<div in:fade={{ duration: 300 }} out:fade={{ duration: 100 }}>
							<div
								class="flex flex-row items-center justify-between space-x-4"
								in:slide={{ duration: 300 }}
								out:slide={{ duration: 100 }}
							>
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
						</div>
					{/if}

					<TimezonePicker
						onValueChange={(newValue: any) => {
							timezone = newValue;
						}}
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

					<TipTapTextEditor
						bind:content={details}
						oninput={debouncedUpdateEvent}
						class="mt-1 min-h-40 w-full rounded-lg border bg-white p-2 text-xs dark:bg-slate-900"
					/>
					<MaxCapacity oninput={debouncedUpdateEvent} bind:value={maxCapacity} />
					<!-- Note: Ticketing and guests are mutually exclusive -->
					{#if !isTicketed}
						<GuestCountFeature oninput={debouncedUpdateEvent} bind:value={maxNumGuest} />
					{/if}

					<TicketingFeature
						oninput={debouncedUpdateEvent}
						bind:isTicketed
						bind:maxTicketsPerUser
						bind:currency={ticketCurrency}
						disabled={!eventCreated}
					/>

					{#if isTicketed}
						<CurrencySelector
							bind:currency={ticketCurrency}
							oninput={debouncedUpdateEvent}
							disabled={eventCreated && hasTicketsSold}
						/>
					{/if}

					<ToggleBringList oninput={debouncedUpdateEvent} bind:checked={isBringListEnabled} />

					{#if isBringListEnabled}
						<div transition:slide={{ duration: 150 }}>
							<RequiredBringItemForAttendance
								oninput={debouncedUpdateEvent}
								bind:checked={requireGuestBringItem}
							/>
						</div>
					{/if}

					<ToggleGallery oninput={debouncedUpdateEvent} bind:checked={isGalleryEnabled} />
					<ToggleMessaging oninput={debouncedUpdateEvent} bind:checked={isMessagingEnabled} />
					<ToggleCuttoffRsvpDate
						oninput={debouncedUpdateEvent}
						bind:checked={isCuttoffDateEnabled}
						bind:cuttoffDate
						maxCutoffDate={dateValue}
						eventStartDatetime={event?.start_time ?? null}
						{timezone}
					/>
				</form>
				<div class="my-10 flex w-full justify-center">
					<div
						class="flex w-1/2 flex-col justify-center space-y-2 sm:w-full sm:flex-row sm:space-x-2 sm:space-y-0"
					>
						{#if isEventCreated && !isEventPublished}
							<Button
								disabled={submitDisabled}
								class={`w-full ${submitDisabled ? 'bg-slate-400 dark:bg-slate-600' : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600'} ring-glow dark:text-white`}
								onclick={() => {
									updateEvent().then(() => {
										redirectToDashboard();
									});
								}}
							>
								<ArrowDownToLine class="ml-1 mr-1 h-4 w-4" /> Draft
							</Button>
						{/if}

						<Button
							id="upsert-bonfire"
							disabled={submitDisabled}
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
						{#if isEventPublished}
							<UnpublishEventBtn {submitDisabled} eventId={event.id} />
						{/if}
						{#if mode == EventFormType.UPDATE && event && currUserId == event.user_id}
							{#if isEventPublished}
								<CancelEventBtn
									{submitDisabled}
									{currUserId}
									eventCreatorUserId={event.user_id}
									eventId={event.id}
								/>
							{/if}
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
			<Tabs.Content value={BonfireEditingTabs.Styles}>
				<EventStyler {eventId} bind:finalStyleCss bind:overlayColor bind:overlayOpacity bind:font />
			</Tabs.Content>
			<Tabs.Content value={BonfireEditingTabs.Admins}>
				<EventAdminEditor eventId={event?.id} {currUserId} eventCreatorId={event?.user_id} />
			</Tabs.Content>
			<Tabs.Content value={BonfireEditingTabs.Reminders}>
				<EventReminders {eventId} {eventName} />
			</Tabs.Content>
			{#if isTicketed && eventCreated}
				<Tabs.Content value={BonfireEditingTabs.Tickets}>
					<TicketTypeManager {eventId} bind:ticketTypes currency={ticketCurrency} canEdit={true} />
				</Tabs.Content>
			{/if}
		</Tabs.Root>
	</section>

	{#if showError}
		<div class="mt-2 rounded-md bg-red-100 p-3 text-red-700">
			{errorMessage}
		</div>
	{/if}
</div>

<!-- Incomplete Ticket Setup Warning Dialog -->
<Dialog.Root bind:open={showIncompleteTicketWarning}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-orange-600">
				<CircleAlert class="h-5 w-5" />
				Cannot Publish - Incomplete Ticket Setup
			</Dialog.Title>
			<Dialog.Description>
				Your ticketed event is missing required information. Please complete the following before
				publishing:
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
				<ul class="space-y-2 text-sm">
					{#each incompleteTicketWarningMessage.split('\n') as item}
						{#if item.trim()}
							<li class="flex items-start gap-2 text-orange-700 dark:text-orange-300">
								<span class="mt-0.5">•</span>
								<span>{item.replace('• ', '')}</span>
							</li>
						{/if}
					{/each}
				</ul>
			</div>

			<div class="text-sm text-gray-600 dark:text-gray-400">
				<p class="font-medium">How to fix:</p>
				<ol class="mt-2 list-inside list-decimal space-y-1">
					{#if !ticketCurrency || !ALLOWED_EVENT_CURRENCIES.includes(ticketCurrency)}
						<li>Go to the currency selector and choose a currency</li>
					{/if}
					{#if ticketTypes.length === 0}
						<li>Click the "Tickets" tab and create at least one ticket type</li>
					{/if}
				</ol>
			</div>
		</div>

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => {
					showIncompleteTicketWarning = false;
					// If no ticket types, switch to tickets tab
					if (ticketTypes.length === 0 && eventCreated) {
						updateURL(BonfireEditingTabs.Tickets);
					}
				}}
			>
				{ticketTypes.length === 0 && eventCreated ? 'Go to Tickets Tab' : 'OK'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Organization Selection Modal -->
<Dialog.Root bind:open={organizationModalOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Building2 class="h-5 w-5" />
				Link Organization
			</Dialog.Title>
			<Dialog.Description>
				Select an organization for this event or create a new one.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			{#if userOrganizations.length > 0}
				<div class="space-y-2">
					<label class="text-sm font-medium">Your Organizations</label>
					<div class="max-h-48 space-y-2 overflow-y-auto">
						<!-- None option -->
						<button
							class="w-full rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 {selectedOrganizationId ===
							null
								? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
								: 'border-gray-200 dark:border-gray-700'}"
							onclick={() => {
								selectedOrganizationId = null;
								debouncedUpdateEvent();
								organizationModalOpen = false;
							}}
						>
							<div class="flex items-center justify-between">
								<span class="italic text-gray-500">No organization</span>
								{#if selectedOrganizationId === null}
									<div class="h-2 w-2 rounded-full bg-blue-500"></div>
								{/if}
							</div>
						</button>

						{#each userOrganizations as org}
							<button
								class="w-full rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 {selectedOrganizationId ===
								org.id
									? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
									: 'border-gray-200 dark:border-gray-700'}"
								onclick={() => {
									selectedOrganizationId = org.id;
									debouncedUpdateEvent();
									organizationModalOpen = false;
								}}
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										{#if org.logo_url}
											<img
												src={org.logo_url}
												alt="{org.name} logo"
												class="h-8 w-8 rounded object-cover"
											/>
										{:else}
											<div
												class="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white"
											>
												{org.name.charAt(0).toUpperCase()}
											</div>
										{/if}
										<div>
											<div class="font-medium">{org.name}</div>
											{#if org.userRole}
												<div class="text-xs capitalize text-gray-500">{org.userRole}</div>
											{/if}
										</div>
									</div>
									{#if selectedOrganizationId === org.id}
										<div class="h-2 w-2 rounded-full bg-blue-500"></div>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>
				<div class="border-t pt-4">
					{#if mode === EventFormType.CREATE && !eventCreated}
						<div class="p-3 text-center text-sm text-gray-600 dark:text-gray-400">
							Save your event first to create organizations
						</div>
					{:else}
						{#if mode === EventFormType.UPDATE}
							<div
								class="mb-3 rounded bg-amber-50 p-2 text-xs text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
							>
								⚠️ Creating an organization will navigate away. Make sure to save your changes
								first.
							</div>
						{/if}
						<Button
							variant="outline"
							class="w-full"
							onclick={() => {
								organizationModalOpen = false;
								goto('/organizations/create');
							}}
						>
							<ExternalLink class="mr-2 h-4 w-4" />
							Create New Organization
						</Button>
					{/if}
				</div>
			{:else}
				<div class="py-6 text-center">
					<Building2 class="mx-auto mb-3 h-12 w-12 text-gray-400" />
					<p class="mb-4 text-gray-600 dark:text-gray-400">You don't have any organizations yet.</p>
					{#if mode === EventFormType.CREATE && !eventCreated}
						<div class="p-3 text-sm text-gray-600 dark:text-gray-400">
							Save your event first to create organizations
						</div>
					{:else}
						{#if mode === EventFormType.UPDATE}
							<div
								class="mb-3 rounded bg-amber-50 p-2 text-xs text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
							>
								⚠️ Creating an organization will navigate away. Make sure to save your changes
								first.
							</div>
						{/if}
						<Button
							variant="outline"
							class="w-full"
							onclick={() => {
								organizationModalOpen = false;
								goto('/organizations/create');
							}}
						>
							<ExternalLink class="mr-2 h-4 w-4" />
							Create New Organization
						</Button>
					{/if}
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
