<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { CalendarPlus } from 'lucide-svelte';

	let { title, start, end = '', description = '', location = '' } = $props();

	console.log('yoooooo', title, start, end, description, location);

	// Ensure start and end are Date objects
	start = start instanceof Date ? start : new Date(start);
	end = end && end !== '' ? new Date(end) : null;

	// Helper function to format date
	const formatDate = (date: Date) => {
		return date.toISOString().replace(/[-:.]/g, '').slice(0, -4);
	};

	// Google Calendar link
	const getGoogleCalendarLink = (e: Event) => {
		e.preventDefault();

		const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
		const startDate = formatDate(start);
		const endDate = end ? formatDate(end) : formatDate(start); // Fallback to start if end is null

		const params = new URLSearchParams({
			text: title,
			dates: `${startDate}/${endDate}`,
			details: description,
			location: location
		});
		return `${baseUrl}&${params.toString()}`;
	};

	// Outlook Calendar link
	const getOutlookCalendarLink = (e: Event) => {
		e.preventDefault();

		const baseUrl = 'https://outlook.office.com/calendar/0/deeplink/compose';
		const startDate = start.toISOString();
		const endDate = end ? end.toISOString() : start.toISOString(); // Fallback to start if end is null

		const params = new URLSearchParams({
			path: '/calendar/action/compose',
			startdt: startDate,
			enddt: endDate,
			subject: title,
			body: description,
			location: location
		});
		return `${baseUrl}?${params.toString()}`;
	};

	// Generate .ics file for Apple Calendar
	const downloadICSFile = (e: Event) => {
		e.preventDefault();

		const startDate = formatDate(start);
		const endDate = end ? formatDate(end) : formatDate(start); // Fallback to start if end is null

		const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
DTSTART:${startDate}Z
DTEND:${endDate}Z
END:VEVENT
END:VCALENDAR`;

		const blob = new Blob([icsContent], { type: 'text/calendar' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `${title}.ics`;
		link.click();
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button id="add-to-calendar" variant="outline"><CalendarPlus /></Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Item onclick={(e) => window.open(getGoogleCalendarLink(e), '_blank')}>
				Google Calendar
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={(e) => window.open(getOutlookCalendarLink(e), '_blank')}>
				Outlook Calendar
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={(e) => downloadICSFile(e)}>Apple Calendar</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
