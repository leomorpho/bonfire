<script lang="ts">
	import { QuestionnaireStep } from '$lib/enums';
	import FlowEffectContainer from '$lib/components/eventform/flow/FlowEffectContainer.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { StepBack } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import { onMount } from 'svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import LikertScaleButton from '$lib/components/LikertScaleButton.svelte';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import AddressInput from '$lib/components/input/location/AddressInput.svelte';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { NLPDateInput } from '$lib/jsrepo/ui/nlp-date-input';

	let previousSteps: QuestionnaireStep[] = $state([]);
	let currentStep: QuestionnaireStep = $state(QuestionnaireStep.Gender);

	function nextStep(next: QuestionnaireStep): void {
		previousSteps.push(currentStep);
		currentStep = next;
		updateURL();
	}

	const prevStep = (): void => {
		if (previousSteps.length > 0) {
			const lastStep = previousSteps.pop();
			if (lastStep !== undefined) {
				currentStep = lastStep;
				updateURL();
			}
		} else {
			currentStep = currentStep - 1;
		}
	};

	function updateURL(): void {
		const url = new URL(window.location.href);
		url.searchParams.set('step', currentStep.toString());
		window.history.pushState({}, '', url);
	}

	function loadStepFromURL(): void {
		const urlParams = new URLSearchParams(window.location.search);
		const stepParam = urlParams.get('step');
		if (stepParam) {
			const step = parseInt(stepParam, 10);
			if (!isNaN(step) && step in QuestionnaireStep) {
				currentStep = step;
				return;
			}
		}
	}

	onMount(() => {
		loadStepFromURL();
	});

	// Get the current date
	const currentDate = today(getLocalTimeZone());

	// Calculate the start and end years
	const startYear = currentDate.year - 100;
	const endYear = currentDate.year - 18;

	// Generate the list of years as strings
	const years = Array.from({ length: endYear - startYear + 1 }, (_, i) =>
		(startYear + i).toString()
	);

	// State for storing form data
	let formData = $state({
		demographicInformation: {
			gender: '',
			location: '',
			geocodedLocation: '',
			latitude: '',
			longitude: '',
			highestLevelOfEducation: '',
			industry: '',
			birthdayYear: '2000',
			relationshipStatus: '',
			hasChildren: ''
		},
		preferencesAndInterests: {
			primaryReasonForUsingApp: []
		},
		personalityTraits: {
			introversionLevel: 0,
			creativityLevel: 0,
			importanceOfEducation: 0,
			adventurousLevel: 0
		},
		consentAndPreferences: {
			receiveNotifications: false,
			agreeToTerms: false
		},
		feedback: {
			howDidYouHearAboutUs: ''
		}
	});

	// Calculate total number of steps
	const totalSteps = Object.keys(QuestionnaireStep).length / 2;
	let progressValue = $derived((currentStep / totalSteps) * 100);
</script>

<div class="mt-20 flex w-full justify-center">
	<div class="flex w-3/4 justify-center sm:w-1/2 lg:w-1/3"><Progress value={progressValue} /></div>
</div>
<div class="relative w-full">
	<div class="mx-auto flex h-[70vh] w-full items-center p-4 sm:w-2/3 md:w-1/2 xl:w-2/5">
		<!-- Step 1: Gender -->
		{#if currentStep === QuestionnaireStep.Gender}
			<FlowEffectContainer>
				{@render title('What is your gender?')}
				<Select.Root
					type="single"
					name="gender"
					bind:value={formData.demographicInformation.gender}
				>
					<Select.Trigger class="mb-4 w-full bg-white dark:bg-slate-900">
						{formData.demographicInformation.gender || 'Select Gender'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.GroupHeading>Gender</Select.GroupHeading>
							<Select.Item value="Male">Male</Select.Item>
							<Select.Item value="Female">Female</Select.Item>
							<Select.Item value="Non-binary">Non-binary</Select.Item>
							<Select.Item value="Other">Other</Select.Item>
							<Select.Item value="Prefer not to say">Prefer not to say</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<div class="flex w-full justify-center space-x-4">
					<Button
						onclick={() => nextStep(QuestionnaireStep.Location)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.Location}
			<!-- Step 2: Location -->
			<FlowEffectContainer>
				{@render title('Where are you located?')}

				<AddressInput
					class="mb-4 w-full bg-white dark:bg-slate-900"
					bind:location={formData.demographicInformation.location}
					bind:geocodedLocation={formData.demographicInformation.geocodedLocation}
					bind:latitude={formData.demographicInformation.latitude}
					bind:longitude={formData.demographicInformation.longitude}
					enterEventLocationText="Enter city..."
				/>
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.HighestLevelOfEducation)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.HighestLevelOfEducation}
			<!-- Step 3: Highest Level of Education -->
			<FlowEffectContainer>
				{@render title('What is your highest level of education?')}
				<Select.Root
					type="single"
					name="education"
					bind:value={formData.demographicInformation.highestLevelOfEducation}
				>
					<Select.Trigger class="mb-4 w-full bg-white dark:bg-slate-900">
						{formData.demographicInformation.highestLevelOfEducation || 'Select Education Level'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.GroupHeading>Education Level</Select.GroupHeading>
							<Select.Item value="High School">High School</Select.Item>
							<Select.Item value="Associate Degree">Associate Degree</Select.Item>
							<Select.Item value="Bachelor's Degree">Bachelor's Degree</Select.Item>
							<Select.Item value="Master's Degree">Master's Degree</Select.Item>
							<Select.Item value="Doctorate">Doctorate</Select.Item>
							<Select.Item value="Other">Other</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.Industry)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.Industry}
			<!-- Step 6: Industry -->
			<FlowEffectContainer>
				{@render title('What industry do you work in?')}
				<Select.Root
					type="single"
					name="industry"
					bind:value={formData.demographicInformation.industry}
				>
					<Select.Trigger class="mb-4 w-full bg-white dark:bg-slate-900">
						{formData.demographicInformation.industry || 'Select Industry'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.GroupHeading>Industry</Select.GroupHeading>
							<Select.Item value="Agriculture">Agriculture</Select.Item>
							<Select.Item value="Construction">Construction</Select.Item>
							<Select.Item value="Consulting">Consulting</Select.Item>
							<Select.Item value="Education">Education</Select.Item>
							<Select.Item value="Energy">Energy</Select.Item>
							<Select.Item value="Entertainment">Entertainment</Select.Item>
							<Select.Item value="Finance">Finance</Select.Item>
							<Select.Item value="Government">Government</Select.Item>
							<Select.Item value="Healthcare">Healthcare</Select.Item>
							<Select.Item value="Hospitality">Hospitality</Select.Item>
							<Select.Item value="Legal">Legal</Select.Item>
							<Select.Item value="Manufacturing">Manufacturing</Select.Item>
							<Select.Item value="Media">Media</Select.Item>
							<Select.Item value="Non-Profit">Non-Profit</Select.Item>
							<Select.Item value="Real Estate">Real Estate</Select.Item>
							<Select.Item value="Retail">Retail</Select.Item>
							<Select.Item value="Technology">Technology</Select.Item>
							<Select.Item value="Telecommunications">Telecommunications</Select.Item>
							<Select.Item value="Transportation">Transportation</Select.Item>
							<Select.Item value="Other">Other</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.Birthday)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.Birthday}
			<FlowEffectContainer>
				{@render title('What is your birth year?')}
				<Select.Root
					type="single"
					name="birthYear"
					bind:value={formData.demographicInformation.birthdayYear}
				>
					<Select.Trigger class="mb-4 w-full bg-white dark:bg-slate-900">
						{formData.demographicInformation.birthdayYear || 'Select Birth Year'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.GroupHeading>Birth Year</Select.GroupHeading>
							{#each years as year}
								<Select.Item value={year}>{year}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.RelationshipStatus)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.RelationshipStatus}
			<!-- Step 8: Relationship Status -->
			<FlowEffectContainer>
				{@render title('What is your relationship status?')}
				<Select.Root
					type="single"
					name="relationshipStatus"
					bind:value={formData.demographicInformation.relationshipStatus}
				>
					<Select.Trigger class="mb-4 w-full bg-white dark:bg-slate-900">
						{formData.demographicInformation.relationshipStatus || 'Select Relationship Status'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.GroupHeading>Relationship Status</Select.GroupHeading>
							<Select.Item value="Single">Single</Select.Item>
							<Select.Item value="In a Relationship">In a Relationship</Select.Item>
							<Select.Item value="Married">Married</Select.Item>
							<Select.Item value="Divorced">Divorced</Select.Item>
							<Select.Item value="Widowed">Widowed</Select.Item>
							<Select.Item value="Prefer not to say">Prefer not to say</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.HasChildren)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.HasChildren}
			<!-- Step 9: Do you have children? -->
			<FlowEffectContainer>
				{@render title('Do you have children?')}
				<div class="flex justify-center space-x-4">
					{@render prevBtn()}

					<Button
						onclick={() => {
							formData.demographicInformation.hasChildren = 'No';
							nextStep(QuestionnaireStep.PrimaryReasonForUsingApp);
						}}
						class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700">No</Button
					>
					<Button
						onclick={() => {
							formData.demographicInformation.hasChildren = 'Yes';
							nextStep(QuestionnaireStep.PrimaryReasonForUsingApp);
						}}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Yes</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.PrimaryReasonForUsingApp}
			<!-- Step 11: Primary Reason for Using App -->
			<FlowEffectContainer>
				{@render title('What are the primary reasons you are using this app?')}
				<Select.Root
					type="multiple"
					name="relationshipStatus"
					bind:value={formData.preferencesAndInterests.primaryReasonForUsingApp}
				>
					<Select.Trigger class="mb-4 w-full bg-white dark:bg-slate-900">
						{formData.preferencesAndInterests.primaryReasonForUsingApp ||
							'Select Relationship Status'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.GroupHeading>Primary Reason</Select.GroupHeading>
							<Select.Item value="Dating">Dating</Select.Item>
							<Select.Item value="Making Friends">Making Friends</Select.Item>
							<Select.Item value="Professional Networking">Professional Networking</Select.Item>
							<Select.Item value="Other">Other</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>

				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.IntroversionLevel)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.IntroversionLevel}
			<!-- Step 13: Introversion Level -->
			<FlowEffectContainer>
				{@render title('How introverted are you?')}
				<LikertScaleButton bind:value={formData.personalityTraits.introversionLevel} />

				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.CreativityLevel)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.CreativityLevel}
			<!-- Step 14: Creativity Level -->
			<FlowEffectContainer>
				{@render title('How creative are you?')}
				<LikertScaleButton bind:value={formData.personalityTraits.creativityLevel} />

				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.ImportanceOfEducation)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.ImportanceOfEducation}
			<!-- Step 15: Importance of Education -->
			<FlowEffectContainer>
				{@render title('How important is education to you?')}
				<LikertScaleButton bind:value={formData.personalityTraits.importanceOfEducation} />

				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.AdventurousLevel)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.AdventurousLevel}
			<!-- Step 16: Adventurous Level -->
			<FlowEffectContainer>
				{@render title('How adventurous are you?')}
				<LikertScaleButton bind:value={formData.personalityTraits.adventurousLevel} />

				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.ReceiveNotifications)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.ReceiveNotifications}
			<!-- Step 17: Receive Notifications -->
			<FlowEffectContainer>
				{@render title('Would you like to receive notifications about upcoming events?')}
				<div class="flex justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => {
							formData.consentAndPreferences.receiveNotifications = false;
							nextStep(QuestionnaireStep.AgreeToTerms);
						}}
						class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700">No</Button
					>
					<Button
						onclick={() => {
							formData.consentAndPreferences.receiveNotifications = true;
							nextStep(QuestionnaireStep.AgreeToTerms);
						}}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Yes</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.AgreeToTerms}
			<!-- Step 18: Agree to Terms -->
			<FlowEffectContainer>
				{@render title('Do you agree to our terms of service and privacy policy?')}
				<div class="flex justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => {
							formData.consentAndPreferences.agreeToTerms = false;
							nextStep(QuestionnaireStep.HowDidYouHearAboutUs);
						}}
						class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700">No</Button
					>
					<Button
						onclick={() => {
							formData.consentAndPreferences.agreeToTerms = true;
							nextStep(QuestionnaireStep.HowDidYouHearAboutUs);
						}}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Yes</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.HowDidYouHearAboutUs}
			<!-- Step 19: How Did You Hear About Us -->
			<FlowEffectContainer>
				{@render title('How did you hear about us?')}
				<Select.Root
					type="single"
					name="howDidYouHear"
					bind:value={formData.feedback.howDidYouHearAboutUs}
				>
					<Select.Trigger class="mb-4 w-full bg-white dark:bg-slate-900">
						{formData.feedback.howDidYouHearAboutUs || 'Select Option'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.GroupHeading>How Did You Hear About Us</Select.GroupHeading>
							<Select.Item value="Social Media">Social Media</Select.Item>
							<Select.Item value="Friend">Friend</Select.Item>
							<Select.Item value="Online Ad">Online Ad</Select.Item>
							<Select.Item value="Other">Other</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.Completion)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.Completion}
			<!-- Step 20: Completion -->
			<FlowEffectContainer>
				{@render title('Questionnaire complete!')}
				<pre>{JSON.stringify(formData, null, 2)}</pre>
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
