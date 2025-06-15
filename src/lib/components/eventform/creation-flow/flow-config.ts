import { FlowStepId, type FlowStepConfig } from './flow-enums';

export const FLOW_STEPS: FlowStepConfig[] = [
	{
		id: FlowStepId.EVENT_NAME,
		title: 'What should we call your event?',
		subtitle: 'Give your event a name that will get people excited to attend',
		component: 'EventNameStep',
		required: true,
		validates: (data) => data.eventName?.trim().length > 0,
		nextStep: FlowStepId.PAID_EVENT
	},
	{
		id: FlowStepId.PAID_EVENT,
		title: 'Is this a paid event?',
		subtitle: 'Let us know if attendees will need to purchase tickets',
		component: 'PaidEventStep', 
		required: true,
		validates: (data) => typeof data.isPaid === 'boolean',
		nextStep: (data) => data.isPaid ? FlowStepId.TICKETING_SETUP : FlowStepId.DATE_TIME
	},
	{
		id: FlowStepId.TICKETING_SETUP,
		title: 'Set up your tickets',
		subtitle: 'Configure ticket pricing and limits',
		component: 'TicketingSetupStep',
		required: true,
		showIf: (data) => data.isPaid === true,
		validates: (data) => data.ticketCurrency && data.maxTicketsPerUser > 0,
		nextStep: FlowStepId.DATE_TIME
	},
	{
		id: FlowStepId.DATE_TIME,
		title: 'When is your event?',
		subtitle: 'Choose the date and time for your event',
		component: 'DateTimeStep',
		required: true,
		validates: (data) => data.startDate && data.startTime?.hour && data.startTime?.minute,
		nextStep: FlowStepId.LOCATION
	},
	{
		id: FlowStepId.LOCATION,
		title: 'Where is your event?',
		subtitle: 'Add a location so attendees know where to go',
		component: 'LocationStep',
		required: true,
		validates: (data) => data.location?.trim().length > 0,
		nextStep: FlowStepId.DESCRIPTION
	},
	{
		id: FlowStepId.DESCRIPTION,
		title: 'Tell us about your event',
		subtitle: 'Add details to help attendees understand what to expect',
		component: 'DescriptionStep',
		required: false,
		nextStep: FlowStepId.EVENT_OPTIONS
	},
	{
		id: FlowStepId.EVENT_OPTIONS,
		title: 'Event settings',
		subtitle: 'Configure additional options for your event',
		component: 'EventOptionsStep',
		required: false
		// No nextStep - this is the final step
	}
];

export function getStepConfig(stepId: FlowStepId): FlowStepConfig | undefined {
	return FLOW_STEPS.find(step => step.id === stepId);
}

export function getNextStep(currentStepId: FlowStepId, data: any): FlowStepId | null {
	const step = getStepConfig(currentStepId);
	if (!step?.nextStep) return null;
	
	if (typeof step.nextStep === 'function') {
		return step.nextStep(data);
	}
	
	return step.nextStep;
}

export function shouldShowStep(stepId: FlowStepId, data: any): boolean {
	const step = getStepConfig(stepId);
	if (!step?.showIf) return true;
	
	return step.showIf(data);
}

export function isStepValid(stepId: FlowStepId, data: any): boolean {
	const step = getStepConfig(stepId);
	if (!step?.validates) return !step?.required; // If no validation and not required, it's valid
	
	return step.validates(data);
}