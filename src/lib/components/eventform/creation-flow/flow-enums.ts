export enum FlowStepId {
	EVENT_NAME = 'event-name',
	PAID_EVENT = 'paid-event', 
	TICKETING_SETUP = 'ticketing-setup',
	DATE_TIME = 'date-time',
	LOCATION = 'location',
	DESCRIPTION = 'description',
	EVENT_OPTIONS = 'event-options'
}

export interface FlowStepConfig {
	id: FlowStepId;
	title: string;
	subtitle?: string;
	component: string;
	required: boolean;
	validates?: (data: any) => boolean;
	nextStep?: FlowStepId | ((data: any) => FlowStepId);
	showIf?: (data: any) => boolean;
}

export interface FlowData {
	// Basic event info
	eventName?: string;
	isPaid?: boolean;
	
	// Date/time
	startDate?: Date;
	startTime?: { hour: string; minute: string; ampm: string };
	endDate?: Date;
	endTime?: { hour: string; minute: string; ampm: string };
	hasEndTime?: boolean;
	timezone?: any;
	
	// Location
	location?: string;
	geocodedLocation?: any;
	latitude?: number;
	longitude?: number;
	
	// Description
	description?: string;
	
	// Ticketing (if paid)
	ticketCurrency?: string;
	maxTicketsPerUser?: number;
	
	// Event options
	maxCapacity?: number | null;
	maxNumGuests?: number | null;
	isBringListEnabled?: boolean;
	isGalleryEnabled?: boolean;
	isMessagingEnabled?: boolean;
	requireGuestBringItem?: boolean;
	isCuttoffDateEnabled?: boolean;
	cuttoffDate?: Date;
	
	// Organization
	organizationId?: string | null;
	
	// Meta
	eventId?: string;
	userId?: string;
}