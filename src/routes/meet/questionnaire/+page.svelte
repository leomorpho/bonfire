<script lang="ts">
	import { onMount } from 'svelte';
	import { getLocalTimeZone, today } from '@internationalized/date';
	import { QuestionnaireStep } from '$lib/enums';
	import Button from '$lib/components/ui/button/button.svelte';
	import { StepBack } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import LikertScaleButton from '$lib/components/LikertScaleButton.svelte';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import AddressInput from '$lib/components/input/location/AddressInput.svelte';
	import { slide } from 'svelte/transition';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';

	const userId = $page.data.user?.id;
	// Define types for survey configuration
	type SurveyOption = string;

	interface Link {
		url: string;
		name: string;
	}

	interface SurveyConfig {
		question: string;
		extraInfo?: string;
		placeholder?: string;
		type: 'select' | 'address' | 'boolean' | 'likert' | 'multiple' | 'completion';
		options?: SurveyOption[];
		field?: string;
		nextStep?: QuestionnaireStep;
		links?: [Link];
	}

	// Define types for form data
	interface Metadata {
		lastUpdatedAt: Date;
	}

	interface DemographicInformation {
		gender: string;
		location: string;
		geocodedLocation: string;
		latitude: string;
		longitude: string;
		highestLevelOfEducation: string;
		industry: string;
		birthdayYear: string;
		relationshipStatus: string;
		hasChildren: string;
	}

	interface PreferencesAndInterests {
		primaryReasonForUsingApp: string[];
	}

	interface PersonalityTraits {
		introversionLevel: number;
		creativityLevel: number;
		importanceOfEducation: number;
		adventurousLevel: number;
	}

	interface ConsentAndPreferences {
		receiveNotifications: boolean;
		agreeToTerms: boolean;
	}

	interface Feedback {
		howDidYouHearAboutUs: string;
	}

	interface FormData {
		metaData: Metadata;
		demographicInformation: DemographicInformation;
		preferencesAndInterests: PreferencesAndInterests;
		personalityTraits: PersonalityTraits;
		consentAndPreferences: ConsentAndPreferences;
		feedback: Feedback;
	}

	// Get the current date
	const currentDate = today(getLocalTimeZone());

	// Calculate the start and end years
	const startYear = currentDate.year - 100;
	const endYear = currentDate.year - 18;

	// Define the survey configuration
	const surveyConfigList: SurveyConfig[] = [
		{
			question: 'What are the primary reasons you want to use Bonfire Meet for?',
			type: 'multiple',
			placeholder: 'Select reason(s)',
			options: ['Dating', 'Making Friends', 'Professional Networking', 'Other'],
			field: 'preferencesAndInterests.primaryReasonForUsingApp',
			nextStep: QuestionnaireStep.IntroversionLevel
		},
		{
			question: 'How introverted are you?',
			type: 'likert',
			field: 'personalityTraits.introversionLevel',
			nextStep: QuestionnaireStep.CreativityLevel
		},
		{
			question: 'How creative are you?',
			type: 'likert',
			field: 'personalityTraits.creativityLevel',
			nextStep: QuestionnaireStep.ImportanceOfEducation
		},
		{
			question: 'How important is education to you?',
			type: 'likert',
			field: 'personalityTraits.importanceOfEducation',
			nextStep: QuestionnaireStep.AdventurousLevel
		},
		{
			question: 'How adventurous are you?',
			type: 'likert',
			field: 'personalityTraits.adventurousLevel',
			nextStep: QuestionnaireStep.ReceiveNotifications
		},
		{
			question: 'What is your gender?',
			extraInfo:
				"While you can use our services to find a romantic partner, we're primarily an app for meeting new people and making friends.",
			type: 'select',
			placeholder: 'Select gender',
			options: ['Man', 'Woman', 'Non-binary', 'Other', 'Prefer not to say'],
			field: 'demographicInformation.gender',
			nextStep: QuestionnaireStep.Location
		},
		{
			question: 'Where are you located?',
			extraInfo: 'You can update this at any time in your profile.',
			type: 'address',
			field: 'demographicInformation.location',
			nextStep: QuestionnaireStep.HighestLevelOfEducation
		},
		{
			question: 'What is your highest level of education?',
			type: 'select',
			placeholder: 'Select education',
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
		{
			question: 'What industry do you work in?',
			type: 'select',
			placeholder: 'Select industry',
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
		{
			question: 'What is your birth year?',
			type: 'select',
			placeholder: 'Select birth year',
			options: Array.from({ length: endYear - startYear + 1 }, (_, i) =>
				(startYear + i).toString()
			),
			field: 'demographicInformation.birthdayYear',
			nextStep: QuestionnaireStep.RelationshipStatus
		},
		{
			question: 'What is your relationship status?',
			type: 'select',
			placeholder: 'Select status',
			options: ['Single', 'In a Relationship', 'Married', 'Prefer not to say'],
			field: 'demographicInformation.relationshipStatus',
			nextStep: QuestionnaireStep.HasChildren
		},
		{
			question: 'Do you have children?',
			type: 'boolean',
			field: 'demographicInformation.hasChildren',
			nextStep: QuestionnaireStep.PrimaryReasonForUsingApp
		},
		{
			question: 'Would you like to receive notifications about upcoming events relevant to you?',
			extraInfo:
				"Install the web app and enable push notifications to stay informed. You can adjust these settings anytime. We value your preferences and will only suggest events we believe you'll truly enjoy.",
			type: 'boolean',
			field: 'consentAndPreferences.receiveNotifications',
			nextStep: QuestionnaireStep.AgreeToTerms
		},
		{
			question: 'Do you agree to our terms of service and privacy policy?',
			extraInfo:
				"We're a privacy-focused startup and will never sell your data. We value your trust and believe in fair business. For full policies, see the links below.",
			type: 'boolean',
			field: 'consentAndPreferences.agreeToTerms',
			nextStep: QuestionnaireStep.HowDidYouHearAboutUs,
			links: [
				{ url: '/privacy-policy', name: 'Privacy Policy' },
				{ url: '/terms-of-use', name: 'Terms of Service' }
			]
		},
		{
			question: 'How did you hear about us?',
			type: 'select',
			placeholder: 'Select',
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
		{
			question: 'All done!',
			extraInfo:
				'Hang tight, we will notify you when we have an event for you! If at any time you want to edit your answers to this questionnaire, head to your profile page!',
			type: 'completion'
		}
	];

	let previousSteps: QuestionnaireStep[] = $state([]);
	let currentStepIndex: number = $state(0);
	let slideDirection: 'up' | 'down' = $state('up');

	function nextStep(): void {
		if (currentStepIndex < surveyConfigList.length - 1) {
			slideDirection = 'up';
			previousSteps.push(currentStepIndex);
			currentStepIndex++;
			updateURL();
			updateQuestionnaireLastUpdate();
			updateMeetQuestionnaire();
		}
	}

	const prevStep = (): void => {
		if (previousSteps.length > 0) {
			slideDirection = 'down';
			currentStepIndex = previousSteps.pop()!;
			updateURL();
			updateQuestionnaireLastUpdate();

			updateMeetQuestionnaire();
		} else if (currentStepIndex != 0) {
			currentStepIndex = currentStepIndex - 1;
		}
	};

	function updateURL(): void {
		const url = new URL(window.location.href);
		url.searchParams.set('step', currentStepIndex.toString());
		window.history.pushState({}, '', url);
	}

	function loadStepFromURL(): void {
		const urlParams = new URLSearchParams(window.location.search);
		const stepParam = urlParams.get('step');
		if (stepParam) {
			const step = parseInt(stepParam, 10);
			if (!isNaN(step) && step < surveyConfigList.length) {
				currentStepIndex = step;
				return;
			}
		}
	}

	const updateQuestionnaireLastUpdate = () => {
		if (!formData.metaData) {
			formData.metaData = {};
		}
		formData.metaData.lastUpdatedAt = new Date();
	};

	onMount(() => {
		loadStepFromURL();
	});

	// State for storing form data
	let formData: FormData = $state({
		metaData: {
			lastUpdatedAt: new Date()
		},
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

	let client: TriplitClient;
	let userPersonalData = $state();
	let isLoadingBeData = $state(true);

	onMount(() => {
		const init = async () => {
			if (!userId) return;

			client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
			userPersonalData = await client.fetchOne(
				client.query('user_personal_data').Where(['user_id', '=', userId])
			);
			if (userPersonalData?.meet_questionnaire) {
				formData = userPersonalData?.meet_questionnaire;
			}
			isLoadingBeData = false;
		};

		init();
	});

	const updateMeetQuestionnaire = async () => {
		await client.http.update('user_personal_data', userPersonalData?.id, async (e) => {
			e.meet_questionnaire = formData;
		});
	};

	function formatListWithCommas(items: string[]): string {
		if (items.length === 0) {
			return '';
		} else if (items.length === 1) {
			return items[0];
		} else {
			return items.join(', ');
		}
	}

	// Helper function to safely access nested properties
	function getNestedProperty<T>(obj: T, path: string): any {
		return path.split('.').reduce((o, p) => (o as any)[p], obj);
	}

	// Calculate total number of steps
	const totalSteps = Object.keys(QuestionnaireStep).length / 2;
	let progressValue = $derived((currentStepIndex / totalSteps) * 100);

	const styles = `
		font-family: 'Montserrat', sans-serif;
		background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/ocean.jpg'); /* Replace with the URL of your tileable image */
		background-repeat: repeat; /* Tiles the image in both directions */
		background-size: auto; /* Ensures the image retains its original size */
		background-color: #ffffff; /* Fallback background color */
		width: 100%;
		height: 100%;   	
  `;
	const overlayStyle = 'background-color: rgba(var(--overlay-color-rgb, 0, 0, 0), 0.4);';
</script>

<div class="bg-color min-h-screen w-full" style={styles}>
	<div class="bg-overlay min-h-screen" style={overlayStyle}>
		<div class="relative pt-4 md:pt-10">
			<div class="flex w-full justify-center">
				<div class="flex w-3/4 justify-center sm:w-1/2 lg:w-1/3">
					<Progress value={progressValue} />
				</div>
			</div>
		</div>
		<div class="relative w-full">
			<div class="mx-auto flex h-[70vh] w-full items-center p-4 sm:w-2/3 md:w-1/2 xl:w-2/5">
				<div class="flex w-full flex-col justify-center">
					{#if isLoadingBeData}
						<div class="mb-4 flex w-full justify-center">
							<div class="loading loading-spinner mr-2 h-6 w-6"></div>
							Loading your data...
						</div>
					{/if}
					{#each surveyConfigList as config, index (index)}
						<div animate:flip>
							{#if currentStepIndex === index}
								<div
									class="w-full"
									in:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 300 }}
									out:slide={{ y: slideDirection === 'up' ? -500 : 500, duration: 100 }}
								>
									<div transition:fade={{ duration: 300 }}>
										{@render title(config.question)}
										{#if config.extraInfo}
											<div class="my-5 text-center text-base">{config.extraInfo}</div>
										{/if}
										{#if config.links}
											<div class="mb-8 mt-5">
												{#each config.links as link}
													<div class="my-2 flex w-full justify-center">
														<Button href={link.url} target="blank"
															>{link.name ? link.name : 'See link'}</Button
														>
													</div>
												{/each}
											</div>
										{/if}
										{#if config.type === 'select'}
											<Select.Root
												type="single"
												name={config.field.split('.')[1]}
												bind:value={
													formData[config.field.split('.')[0]][config.field.split('.')[1]]
												}
											>
												<Select.Trigger class="mb-4 w-full bg-white dark:bg-slate-900">
													{getNestedProperty(formData, config.field) ||
														`${config.placeholder}` ||
														'Select'}
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
										{:else if config.type === 'multiple'}
											<Select.Root
												type="multiple"
												name={config.field.split('.')[1]}
												bind:value={
													formData[config.field.split('.')[0]][config.field.split('.')[1]]
												}
											>
												<Select.Trigger
													class="mb-4 h-auto min-h-[40px] w-full whitespace-normal bg-white dark:bg-slate-900"
												>
													{formatListWithCommas(getNestedProperty(formData, config.field)) ||
														`${config.placeholder}` ||
														'Select'}
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
												bind:location={
													formData[config.field.split('.')[0]][config.field.split('.')[1]]
												}
												bind:geocodedLocation={formData.demographicInformation.geocodedLocation}
												bind:latitude={formData.demographicInformation.latitude}
												bind:longitude={formData.demographicInformation.longitude}
												enterEventLocationText="Enter city..."
											/>
										{:else if config.type === 'likert'}
											<LikertScaleButton
												scale={5}
												bind:value={
													formData[config.field.split('.')[0]][config.field.split('.')[1]]
												}
											/>
										{:else if config.type === 'completion'}
											<div class="flex w-full justify-center">
												<Button href="/dashboard">Return to dashboard</Button>
											</div>
										{/if}

										{#if config.type !== 'completion'}
											<div class="flex w-full justify-center space-x-4">
												{#if index != 0}
													{@render prevBtn()}
												{/if}
												{#if config.type !== 'boolean'}
													<Button
														disabled={!getNestedProperty(formData, config.field)}
														onclick={() => nextStep()}
														class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
														>Next</Button
													>
												{:else}
													<Button
														onclick={() => {
															formData[config.field.split('.')[0]][config.field.split('.')[1]] =
																'No';
															nextStep();
														}}
														class="rounded bg-purple-800 px-4 py-2 text-white hover:bg-purple-700"
														>No</Button
													>
													<Button
														onclick={() => {
															formData[config.field.split('.')[0]][config.field.split('.')[1]] =
																'Yes';
															nextStep();
														}}
														class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
														>Yes</Button
													>
												{/if}
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
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
