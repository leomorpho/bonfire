<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { FlowStepId, type FlowData } from './flow-enums';
	import { FLOW_STEPS, getStepConfig, getNextStep, shouldShowStep, isStepValid } from './flow-config';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, ArrowRight } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { createEvent, updateEvent, getEventOperationsClient, type EventData } from '$lib/event-operations';
	import KeyBoardShortcut from '$lib/components/KeyBoardShortcut.svelte';
	
	// Step components
	import EventNameStep from './steps/EventNameStep.svelte';
	import PaidEventStep from './steps/PaidEventStep.svelte';
	import TicketingSetupStep from './steps/TicketingSetupStep.svelte';
	import DateTimeStep from './steps/DateTimeStep.svelte';
	import LocationStep from './steps/LocationStep.svelte';
	import DescriptionStep from './steps/DescriptionStep.svelte';
	import EventOptionsStep from './steps/EventOptionsStep.svelte';

	let client: TriplitClient;
	let eventClient: TriplitClient; // Client with user JWT for event operations
	let currentStepId = $state<FlowStepId>(FlowStepId.EVENT_NAME);
	let flowData = $state<FlowData>({});
	let isLoading = $state(false);
	let isSaving = $state(false);

	const stepComponents = {
		EventNameStep,
		PaidEventStep,
		TicketingSetupStep,
		DateTimeStep,
		LocationStep,
		DescriptionStep,
		EventOptionsStep
	};

	let currentStepConfig = $derived(getStepConfig(currentStepId));
	let currentComponent = $derived(currentStepConfig ? stepComponents[currentStepConfig.component as keyof typeof stepComponents] : null);
	let isCurrentStepValid = $derived(currentStepConfig ? isStepValid(currentStepId, flowData) : false);
	let canProceed = $derived(isCurrentStepValid && !isLoading && !isSaving);

	// Progress calculation
	let visibleSteps = $derived(FLOW_STEPS.filter(step => shouldShowStep(step.id, flowData)));
	let currentStepIndex = $derived(visibleSteps.findIndex(step => step.id === currentStepId));
	let progressPercentage = $derived(Math.round(((currentStepIndex + 1) / visibleSteps.length) * 100));

	onMount(async () => {
		isLoading = true;
		try {
			client = getFeWorkerTriplitClient($page.data.jwt);
			
			// Get event operations client with user JWT
			eventClient = await getEventOperationsClient();
			
			const userId = await waitForUserId();
			if (!userId) {
				toast.error('Please log in to create an event');
				goto('/login');
				return;
			}
			flowData.userId = userId;
		} catch (error) {
			console.error('Error initializing flow:', error);
			toast.error('Failed to initialize event creation');
		} finally {
			isLoading = false;
		}
	});

	async function saveProgress() {
		// Only create/update event if we have minimum required fields
		if (hasMinimumRequiredFields()) {
			if (!flowData.eventId) {
				// Create the event on first save
				await createDraftEvent();
			} else {
				// Update existing event
				await updateDraftEvent();
			}
		}
		// Always save the step progress locally even if we can't save to DB yet
	}

	function hasMinimumRequiredFields(): boolean {
		// Required fields from schema: title, start_time, user_id
		const hasValidDateTime = combineDateTime(flowData.startDate, flowData.startTime) !== null;
		return !!(
			flowData.eventName?.trim() &&
			hasValidDateTime &&
			flowData.userId
		);
	}

	async function createDraftEvent() {
		if (!flowData.userId) return;
		
		isSaving = true;
		try {
			const startTime = combineDateTime(flowData.startDate, flowData.startTime);
			if (!startTime) {
				throw new Error('Invalid start time');
			}

			const eventData: Omit<EventData, 'id' | 'user_id'> = {
				title: flowData.eventName!,
				description: flowData.description || '',
				location: flowData.location || '',
				geocoded_location: flowData.geocodedLocation,
				start_time: startTime,
				end_time: flowData.hasEndTime ? combineDateTime(flowData.endDate || flowData.startDate, flowData.endTime) : null,
				organization_id: flowData.organizationId || null,
				is_ticketed: flowData.isPaid || false,
				ticket_currency: flowData.ticketCurrency || 'usd',
				max_tickets_per_user: flowData.maxTicketsPerUser || 5,
				max_capacity: flowData.maxCapacity || null,
				max_num_guests_per_attendee: flowData.isPaid ? 0 : (flowData.maxNumGuests || 0),
				is_bring_list_enabled: flowData.isBringListEnabled || false,
				is_gallery_enabled: flowData.isGalleryEnabled ?? true,
				is_messaging_enabled: flowData.isMessagingEnabled ?? true,
				require_guest_bring_item: flowData.requireGuestBringItem || false,
				is_cut_off_date_enabled: flowData.isCuttoffDateEnabled || false,
				cut_off_date: flowData.cuttoffDate || null,
				latitude: flowData.latitude || null,
				longitude: flowData.longitude || null
			};

			const { eventId } = await createEvent(eventClient, eventData);
			flowData.eventId = eventId;
			console.log('Draft event created:', eventId);
		} catch (error) {
			console.error('Error creating draft event:', error);
			toast.error('Failed to save event progress');
		} finally {
			isSaving = false;
		}
	}

	async function updateDraftEvent() {
		if (!flowData.eventId) return;

		isSaving = true;
		try {
			const startTime = combineDateTime(flowData.startDate, flowData.startTime);
			if (!startTime) {
				throw new Error('Invalid start time');
			}

			const updateData: Partial<EventData> = {
				title: flowData.eventName!,
				description: flowData.description || '',
				location: flowData.location || '',
				geocoded_location: flowData.geocodedLocation,
				start_time: startTime,
				end_time: flowData.hasEndTime ? combineDateTime(flowData.endDate || flowData.startDate, flowData.endTime) : null,
				organization_id: flowData.organizationId || null,
				is_ticketed: flowData.isPaid || false,
				ticket_currency: flowData.ticketCurrency || 'usd',
				max_tickets_per_user: flowData.maxTicketsPerUser || 5,
				max_capacity: flowData.maxCapacity || null,
				max_num_guests_per_attendee: flowData.isPaid ? 0 : (flowData.maxNumGuests || 0),
				is_bring_list_enabled: flowData.isBringListEnabled || false,
				is_gallery_enabled: flowData.isGalleryEnabled ?? true,
				is_messaging_enabled: flowData.isMessagingEnabled ?? true,
				require_guest_bring_item: flowData.requireGuestBringItem || false,
				is_cut_off_date_enabled: flowData.isCuttoffDateEnabled || false,
				cut_off_date: flowData.cuttoffDate || null,
				latitude: flowData.latitude || null,
				longitude: flowData.longitude || null
			};

			await updateEvent(eventClient, flowData.eventId, updateData);
			console.log('Draft event updated:', flowData.eventId);
		} catch (error) {
			console.error('Error updating draft event:', error);
			toast.error('Failed to save event progress');
		} finally {
			isSaving = false;
		}
	}

	function combineDateTime(date: Date | undefined, time: { hour: string; minute: string; ampm: string } | undefined): Date | null {
		if (!date || !time?.hour || !time?.minute) return null;
		
		const combined = new Date(date);
		let hour = parseInt(time.hour);
		
		if (time.ampm === 'PM' && hour !== 12) {
			hour += 12;
		} else if (time.ampm === 'AM' && hour === 12) {
			hour = 0;
		}
		
		combined.setHours(hour, parseInt(time.minute), 0, 0);
		return combined;
	}

	async function handleNext() {
		if (!canProceed) return;

		// Save progress after each step
		await saveProgress();

		const nextStepId = getNextStep(currentStepId, flowData);
		if (nextStepId) {
			currentStepId = nextStepId;
		} else {
			// Final step - redirect to event
			if (flowData.eventId) {
				toast.success('Event created successfully! 🎉');
				goto(`/bonfire/${flowData.eventId}`);
			}
		}
	}

	function handleBack() {
		const currentIndex = visibleSteps.findIndex(step => step.id === currentStepId);
		if (currentIndex > 0) {
			currentStepId = visibleSteps[currentIndex - 1].id;
		}
	}

	function handleCancel() {
		goto('/dashboard');
	}

	function handleEnterPress(event: KeyboardEvent) {
		// Don't trigger if user is typing in an input, textarea, or interacting with a popover
		const target = event.target as HTMLElement;
		if (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'BUTTON' ||
			target.closest('[role="dialog"]') ||
			target.closest('[data-portal]') ||
			target.closest('.popover-content') ||
			target.closest('[data-radix-popper-content-wrapper]')
		) {
			return;
		}

		// Only handle Enter if we can proceed to next step
		if (canProceed) {
			event.preventDefault();
			handleNext();
		}
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<!-- Progress bar -->
	<div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
		<div class="max-w-2xl mx-auto px-4 py-4">
			<div class="flex items-center justify-between mb-2">
				<h1 class="text-lg font-semibold text-gray-900 dark:text-white">Create Event</h1>
				<span class="text-sm text-gray-500">{currentStepIndex + 1} of {visibleSteps.length}</span>
			</div>
			<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
				<div 
					class="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
					style="width: {progressPercentage}%"
				></div>
			</div>
		</div>
	</div>

	<!-- Step content -->
	<div class="max-w-2xl mx-auto px-4 py-8">
		{#if isLoading}
			<div class="flex justify-center py-12">
				<div class="text-gray-500">Initializing...</div>
			</div>
		{:else if currentStepConfig && currentComponent}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
				<div class="mb-6">
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						{currentStepConfig.title}
					</h2>
					{#if currentStepConfig.subtitle}
						<p class="text-gray-600 dark:text-gray-400">
							{currentStepConfig.subtitle}
						</p>
					{/if}
				</div>

				<!-- Render current step component -->
				{#if currentComponent}
					{@render renderCurrentStep()}
				{/if}
				
				{#snippet renderCurrentStep()}
					{#if currentStepId === FlowStepId.EVENT_NAME}
						<EventNameStep bind:data={flowData} />
					{:else if currentStepId === FlowStepId.PAID_EVENT}
						<PaidEventStep bind:data={flowData} />
					{:else if currentStepId === FlowStepId.TICKETING_SETUP}
						<TicketingSetupStep bind:data={flowData} />
					{:else if currentStepId === FlowStepId.DATE_TIME}
						<DateTimeStep bind:data={flowData} />
					{:else if currentStepId === FlowStepId.LOCATION}
						<LocationStep bind:data={flowData} />
					{:else if currentStepId === FlowStepId.DESCRIPTION}
						<DescriptionStep bind:data={flowData} />
					{:else if currentStepId === FlowStepId.EVENT_OPTIONS}
						<EventOptionsStep bind:data={flowData} />
					{/if}
				{/snippet}
			</div>

			<!-- Navigation buttons -->
			<div class="flex justify-between items-center mt-6">
				<div>
					{#if currentStepIndex > 0}
						<Button variant="outline" onclick={handleBack} disabled={isSaving}>
							<ArrowLeft class="h-4 w-4 mr-2" />
							Back
						</Button>
					{:else}
						<Button variant="outline" onclick={handleCancel}>
							Cancel
						</Button>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					{#if isSaving}
						<span class="text-sm text-gray-500">Saving...</span>
					{/if}
					<Button onclick={handleNext} disabled={!canProceed}>
						{#if getNextStep(currentStepId, flowData)}
							Next
							<ArrowRight class="h-4 w-4 ml-2" />
						{:else}
							Create Event
						{/if}
					</Button>
				</div>
			</div>
		{:else}
			<div class="text-center py-12">
				<p class="text-red-600">Invalid step configuration</p>
			</div>
		{/if}
	</div>
</div>

<!-- Keyboard shortcuts -->
<KeyBoardShortcut key="enter" callback={handleEnterPress} />
