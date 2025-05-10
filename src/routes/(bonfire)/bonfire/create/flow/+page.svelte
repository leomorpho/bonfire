<script lang="ts">
	import { EventCreationStep } from '$lib/enums';
	import FlowEffectContainer from '$lib/components/eventform/flow/FlowEffectContainer.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Clock, Clock8, Minus, Plus, StepBack } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import { fade, slide } from 'svelte/transition';

	let previousSteps: number[] = $state([]);
	let currentStep: number = $state(1);

	function nextStep(next: number): void {
		previousSteps.push(currentStep);
		currentStep = next;
	}

	const prevStep = (): void => {
		// Pop the last step from the stack to go back
		if (previousSteps.length > 0) {
			const lastStep = previousSteps.pop();
			if (lastStep !== undefined) {
				currentStep = lastStep;
			}
		}
	};

	let setEndTime = $state(false);

	let eventName = $state('');
	let dateValue = $state('');
	let startHour = $state('');
	let startMinute = $state('');
	let ampmStart = $state('PM'); // State for AM/PM
	let endHour = $state('');
	let endMinute = $state('');
	let ampmEnd = $state('PM');
</script>

<div class="flex w-full justify-center">
	<div class="mx-auto flex h-[70vh] max-w-md items-center p-4">
		<!-- Step 1: Event Date -->
		{#if currentStep === EventCreationStep.EventDate}
			<FlowEffectContainer>
				{@render title('Does this event already have a date?')}
				<div class="flex justify-center space-x-4">
					<Button
						onclick={() => nextStep(EventCreationStep.FindDate)}
						class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700">No</Button
					>
					<Button
						onclick={() => nextStep(EventCreationStep.DateAndTime)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Yes</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.DateAndTime}
			<!-- Step 2: Date and Time -->
			<FlowEffectContainer>
				{@render title('When is it happening?')}
				<Datepicker bind:value={dateValue} class="mb-4" />

				<div class="mb-4 flex flex-row items-center justify-between space-x-4">
					<!-- Start Time Inputs -->
					<div class="grid grid-cols-4 items-center gap-2">
						<Clock
							class="ml-4 mr-1 h-4 w-4 rounded-xl bg-white text-slate-500 ring-glow dark:bg-slate-900"
						/>
						<div class="font-mono">
							<DoubleDigitsPicker maxValue={12} bind:value={startHour} placeholder="HH" />
						</div>
						<div class="font-mono">
							<DoubleDigitsPicker bind:value={startMinute} placeholder="mm" />
						</div>
						<div class="w-18">
							<AmPmPicker onValueChange={(newValue: any) => (ampmStart = newValue)} />
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
							class="mb-4 flex flex-row items-center justify-between space-x-4"
							in:slide={{ duration: 300 }}
							out:slide={{ duration: 100 }}
						>
							<!-- End Time Inputs -->
							<div class="grid grid-cols-4 items-center gap-2">
								<Clock8
									class="ml-4 mr-1 h-4 w-4 rounded-xl bg-white text-slate-500 ring-glow dark:bg-slate-900"
								/>

								<div class="font-mono">
									<DoubleDigitsPicker maxValue={12} bind:value={endHour} placeholder="HH" />
								</div>
								<div class="font-mono">
									<DoubleDigitsPicker bind:value={endMinute} placeholder="mm" />
								</div>
								<div class="w-18">
									<AmPmPicker onValueChange={(newValue: any) => (ampmEnd = newValue)} />
								</div>
							</div>

							<!-- Toggle Button -->

							<Button class="hidden text-xs ring-glow"></Button>
						</div>
					</div>
				{/if}
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(EventCreationStep.EventName)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.FindDate}
			<!-- Step 3: Find a Date -->
			<FlowEffectContainer>
				{@render title("Let's find a date that works for the group.")}
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(EventCreationStep.EventName)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.EventName}
			<!-- Step 4: Event Name -->
			<FlowEffectContainer>
				{@render title("What's the event name?")}
				<Input
					type="text"
					placeholder="Event Name"
					bind:value={eventName}
					class="mb-4 w-full bg-white dark:bg-slate-900"
				/>
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(EventCreationStep.Address)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.Address}
			<!-- Step 5: Address -->
			<FlowEffectContainer>
				{@render title('Do you have an address?')}
				<input type="text" class="mb-4 w-full rounded border p-2" />
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(EventCreationStep.LimitCapacity)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.LimitCapacity}
			<!-- Step 6: Limit Capacity -->
			<FlowEffectContainer>
				{@render title('Do you want to limit capacity?')}
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}

					<Button
						onclick={() => nextStep(EventCreationStep.BringList)}
						class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700">No</Button
					>
					<Button
						onclick={() => nextStep(EventCreationStep.CapacityLimit)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Yes</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.CapacityLimit}
			<!-- Step 7: Capacity Limit -->
			<FlowEffectContainer>
				{@render title('What is the capacity limit?')}
				<input type="number" class="mb-4 w-full rounded border p-2" />
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(EventCreationStep.BringList)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.BringList}
			<!-- Step 8: Bring List -->
			<FlowEffectContainer>
				{@render title('Do you want to enable a bring list?')}
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(EventCreationStep.AllowGuests)}
						class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700">No</Button
					>
					<Button
						onclick={() => nextStep(EventCreationStep.ForceBringSomething)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Yes</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.ForceBringSomething}
			<!-- Step 9: Force Bring Something -->
			<FlowEffectContainer>
				{@render title('Do you want to force people to bring something to attend?')}
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(EventCreationStep.AllowGuests)}
						class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700">No</Button
					>
					<Button
						onclick={() => nextStep(EventCreationStep.AllowGuests)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Yes</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.AllowGuests}
			<!-- Step 10: Allow Guests -->
			<FlowEffectContainer>
				{@render title('Do you want to allow attendees to bring guests?')}
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(EventCreationStep.Completion)}
						class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700">No</Button
					>
					<Button
						onclick={() => nextStep(EventCreationStep.GuestsPerAttendee)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Yes</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.GuestsPerAttendee}
			<!-- Step 11: Guests per Attendee -->
			<FlowEffectContainer>
				{@render title('How many guests per attendee?')}

				<input type="number" class="mb-4 w-full rounded border p-2" />
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(EventCreationStep.Completion)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === EventCreationStep.Completion}
			<!-- Step 12: Completion -->
			<FlowEffectContainer>
				{@render title('Event setup complete!')}
			</FlowEffectContainer>
		{/if}
	</div>
</div>

{#snippet title(text: string)}
	<h2 class="mb-4 flex w-full justify-center text-center text-xl font-bold">{text}</h2>
{/snippet}

{#snippet prevBtn()}
	<Button
		onclick={prevStep}
		class="mb-4 self-start rounded bg-orange-800 px-4 py-2 text-white hover:bg-orange-700"
	>
		<StepBack />
	</Button>
{/snippet}
