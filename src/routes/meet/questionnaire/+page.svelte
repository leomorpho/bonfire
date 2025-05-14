<script lang="ts">
	import { onMount } from 'svelte';
	import { getLocalTimeZone, today } from '@internationalized/date';
	import { QuestionnaireStep } from '$lib/enums';
	import FlowEffectContainer from '$lib/components/eventform/flow/FlowEffectContainer.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { StepBack } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import LikertScaleButton from '$lib/components/LikertScaleButton.svelte';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import AddressInput from '$lib/components/input/location/AddressInput.svelte';

	// Get the current date
	const currentDate = today(getLocalTimeZone());

	// Calculate the start and end years
	const startYear = currentDate.year - 100;
	const endYear = currentDate.year - 18;

	// Generate the list of years as strings
	const years = Array.from({ length: endYear - startYear + 1 }, (_, i) =>
		(startYear + i).toString()
	);

	// Define the survey configuration
	const surveyConfig = {
		[QuestionnaireStep.Gender]: {
			question: 'What is your gender?',
			type: 'select',
			options: ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'],
			field: 'demographicInformation.gender',
			nextStep: QuestionnaireStep.Location
		},
		[QuestionnaireStep.Location]: {
			question: 'Where are you located?',
			type: 'address',
			field: 'demographicInformation.location',
			nextStep: QuestionnaireStep.HighestLevelOfEducation
		},
		[QuestionnaireStep.HighestLevelOfEducation]: {
			question: 'What is your highest level of education?',
			type: 'select',
			options: [
				'High School',
				'Associate Degree',
				"Bachelor's Degree",
				"Master's Degree",
				'Doctorate',
				'Other'
			],
			field: 'demographicInformation.highestLevelOfEducation',
			nextStep: QuestionnaireStep.Industry
		},
		[QuestionnaireStep.Industry]: {
			question: 'What industry do you work in?',
			type: 'select',
			options: [
				'Agriculture',
				'Construction',
				'Consulting',
				'Education',
				'Energy',
				'Entertainment',
				'Finance',
				'Government',
				'Healthcare',
				'Hospitality',
				'Legal',
				'Manufacturing',
				'Media',
				'Non-Profit',
				'Real Estate',
				'Retail',
				'Technology',
				'Telecommunications',
				'Transportation',
				'Other'
			],
			field: 'demographicInformation.industry',
			nextStep: QuestionnaireStep.Birthday
		},
		[QuestionnaireStep.Birthday]: {
			question: 'What is your birth year?',
			type: 'select',
			options: Array.from({ length: endYear - startYear + 1 }, (_, i) =>
				(startYear + i).toString()
			),
			field: 'demographicInformation.birthdayYear',
			nextStep: QuestionnaireStep.RelationshipStatus
		},
		[QuestionnaireStep.RelationshipStatus]: {
			question: 'What is your relationship status?',
			type: 'select',
			options: [
				'Single',
				'In a Relationship',
				'Married',
				'Divorced',
				'Widowed',
				'Prefer not to say'
			],
			field: 'demographicInformation.relationshipStatus',
			nextStep: QuestionnaireStep.HasChildren
		},
		[QuestionnaireStep.HasChildren]: {
			question: 'Do you have children?',
			type: 'boolean',
			field: 'demographicInformation.hasChildren',
			nextStep: QuestionnaireStep.PrimaryReasonForUsingApp
		},
		[QuestionnaireStep.PrimaryReasonForUsingApp]: {
			question: 'What are the primary reasons you are using this app?',
			type: 'multiple',
			options: ['Dating', 'Making Friends', 'Professional Networking', 'Other'],
			field: 'preferencesAndInterests.primaryReasonForUsingApp',
			nextStep: QuestionnaireStep.IntroversionLevel
		},
		[QuestionnaireStep.IntroversionLevel]: {
			question: 'How introverted are you?',
			type: 'likert',
			field: 'personalityTraits.introversionLevel',
			nextStep: QuestionnaireStep.CreativityLevel
		},
		[QuestionnaireStep.CreativityLevel]: {
			question: 'How creative are you?',
			type: 'likert',
			field: 'personalityTraits.creativityLevel',
			nextStep: QuestionnaireStep.ImportanceOfEducation
		},
		[QuestionnaireStep.ImportanceOfEducation]: {
			question: 'How important is education to you?',
			type: 'likert',
			field: 'personalityTraits.importanceOfEducation',
			nextStep: QuestionnaireStep.AdventurousLevel
		},
		[QuestionnaireStep.AdventurousLevel]: {
			question: 'How adventurous are you?',
			type: 'likert',
			field: 'personalityTraits.adventurousLevel',
			nextStep: QuestionnaireStep.ReceiveNotifications
		},
		[QuestionnaireStep.ReceiveNotifications]: {
			question: 'Would you like to receive notifications about upcoming events?',
			type: 'boolean',
			field: 'consentAndPreferences.receiveNotifications',
			nextStep: QuestionnaireStep.AgreeToTerms
		},
		[QuestionnaireStep.AgreeToTerms]: {
			question: 'Do you agree to our terms of service and privacy policy?',
			type: 'boolean',
			field: 'consentAndPreferences.agreeToTerms',
			nextStep: QuestionnaireStep.HowDidYouHearAboutUs
		},
		[QuestionnaireStep.HowDidYouHearAboutUs]: {
			question: 'How did you hear about us?',
			type: 'select',
			options: [
				'Social Media - Facebook',
				'Social Media - TikTok',
				'Social Media - Instagram',
				'Social Media - Other',
				'Friend',
				'Online Ad',
				'Other'
			],
			field: 'feedback.howDidYouHearAboutUs',
			nextStep: QuestionnaireStep.Completion
		},
		[QuestionnaireStep.Completion]: {
			question: 'Questionnaire complete!',
			type: 'completion'
		}
	};

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
			updateURL();
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

	function formatListWithCommas(items: string[]): string {
		if (items.length === 0) {
			return '';
		} else if (items.length === 1) {
			return items[0];
		} else {
			return items.join(', ');
		}
	}

	// Calculate total number of steps
	const totalSteps = Object.keys(QuestionnaireStep).length / 2;
	let progressValue = $derived((currentStep / totalSteps) * 100);
</script>

<div class="mt-20 flex w-full justify-center">
	<div class="flex w-3/4 justify-center sm:w-1/2 lg:w-1/3"><Progress value={progressValue} /></div>
</div>
<div class="relative w-full">
	<div class="mx-auto flex h-[70vh] w-full items-center p-4 sm:w-2/3 md:w-1/2 xl:w-2/5">
		{#each Object.entries(surveyConfig) as [step, config]}
			{#if currentStep === parseInt(step)}
				<FlowEffectContainer>
					{@render title(config.question)}
					{#if config.type === 'select'}
						<Select.Root
							type="single"
							name={config.field.split('.')[1]}
							bind:value={formData[config.field.split('.')[0]][config.field.split('.')[1]]}
						>
							<Select.Trigger class="mb-4 w-full bg-white dark:bg-slate-900">
								{formData[config.field.split('.')[0]][config.field.split('.')[1]] ||
									`Select ${config.question}`}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.GroupHeading>{config.question}</Select.GroupHeading>
									{#each config.options as option}
										<Select.Item value={option}>{option}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					{:else if config.type === 'address'}
						<AddressInput
							class="mb-4 w-full bg-white dark:bg-slate-900"
							bind:location={formData[config.field.split('.')[0]][config.field.split('.')[1]]}
							bind:geocodedLocation={formData.demographicInformation.geocodedLocation}
							bind:latitude={formData.demographicInformation.latitude}
							bind:longitude={formData.demographicInformation.longitude}
							enterEventLocationText="Enter city..."
						/>
					{:else if config.type === 'boolean'}
						<div class="flex justify-center space-x-4">
							<Button
								onclick={() => {
									formData[config.field.split('.')[0]][config.field.split('.')[1]] = 'No';
									nextStep(config.nextStep);
								}}
								class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700">No</Button
							>
							<Button
								onclick={() => {
									formData[config.field.split('.')[0]][config.field.split('.')[1]] = 'Yes';
									nextStep(config.nextStep);
								}}
								class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Yes</Button
							>
						</div>
					{:else if config.type === 'likert'}
						<LikertScaleButton
							bind:value={formData[config.field.split('.')[0]][config.field.split('.')[1]]}
						/>
					{:else if config.type === 'multiple'}
						<Select.Root
							type="multiple"
							name={config.field.split('.')[1]}
							bind:value={formData[config.field.split('.')[0]][config.field.split('.')[1]]}
						>
							<Select.Trigger
								class="mb-4 h-auto min-h-[40px] w-full whitespace-normal bg-white dark:bg-slate-900"
							>
								{formatListWithCommas(
									formData[config.field.split('.')[0]][config.field.split('.')[1]]
								) || `Select ${config.question}`}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.GroupHeading>{config.question}</Select.GroupHeading>
									{#each config.options as option}
										<Select.Item value={option}>{option}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					{:else if config.type === 'completion'}
						<pre>{JSON.stringify(formData, null, 2)}</pre>
					{/if}
					{#if config.type !== 'boolean' && config.type !== 'completion'}
						<div class="flex w-full justify-center space-x-4">
							{@render prevBtn()}
							<Button
								disabled={!formData[config.field.split('.')[0]][config.field.split('.')[1]]}
								onclick={() => nextStep(config.nextStep)}
								class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Next</Button
							>
						</div>
					{/if}
				</FlowEffectContainer>
			{/if}
		{/each}
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
