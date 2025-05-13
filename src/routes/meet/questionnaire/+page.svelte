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

	// State for storing form data
	let formData = $state({
		demographicInformation: {
			gender: '',
			location: '',
			highestLevelOfEducation: '',
			fieldOfStudy: '',
			occupation: '',
			industry: '',
			birthday: '',
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
</script>

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
					{@render prevBtn()}
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
				<Input
					type="text"
					bind:value={formData.demographicInformation.location}
					placeholder="City, State/Province, Country"
					class="mb-4 w-full bg-white dark:bg-slate-900"
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
						onclick={() => nextStep(QuestionnaireStep.FieldOfStudy)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.FieldOfStudy}
			<!-- Step 4: Field of Study -->
			<FlowEffectContainer>
				{@render title('What is your field of study?')}
				<Input
					type="text"
					bind:value={formData.demographicInformation.fieldOfStudy}
					placeholder="Field of Study"
					class="mb-4 w-full bg-white dark:bg-slate-900"
				/>
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.Occupation)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.Occupation}
			<!-- Step 5: Occupation -->
			<FlowEffectContainer>
				{@render title('What is your occupation?')}
				<Input
					type="text"
					bind:value={formData.demographicInformation.occupation}
					placeholder="Occupation"
					class="mb-4 w-full bg-white dark:bg-slate-900"
				/>
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
				<Input
					type="text"
					bind:value={formData.demographicInformation.industry}
					placeholder="Industry"
					class="mb-4 w-full bg-white dark:bg-slate-900"
				/>
				<div class="flex w-full justify-center space-x-4">
					{@render prevBtn()}
					<Button
						onclick={() => nextStep(QuestionnaireStep.Birthday)}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
					>
				</div>
			</FlowEffectContainer>
		{:else if currentStep === QuestionnaireStep.Birthday}
			<!-- Step 7: Birthday -->
			<FlowEffectContainer>
				{@render title('What is your birthday?')}
				<Datepicker
					bind:value={formData.demographicInformation.birthday}
					class="mb-4 w-full bg-white dark:bg-slate-900"
				/>
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
