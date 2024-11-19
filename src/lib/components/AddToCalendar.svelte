<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { CalendarPlus } from 'lucide-svelte';

	// Event details
	let eventDetails = {
		title: 'Event Title',
		start: '2024-11-21T01:00:00.000Z',
		end: '2024-11-21T03:00:00.000Z',
		description: 'Event description goes here',
		location: '123 Event Street, City, Country'
	};

	// Google Calendar link
	const getGoogleCalendarLink = (e: Event, event) => {
		e.preventDefault();

		const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
		const params = new URLSearchParams({
			text: event.title,
			dates: `${new Date(event.start).toISOString().replace(/[-:.]/g, '').slice(0, -4)}/${new Date(
				event.end
			)
				.toISOString()
				.replace(/[-:.]/g, '')
				.slice(0, -4)}`,
			details: event.description,
			location: event.location
		});
		return `${baseUrl}&${params.toString()}`;
	};

	// Outlook Calendar link
	const getOutlookCalendarLink = (e: Event, event) => {
		e.preventDefault();

		const baseUrl = 'https://outlook.office.com/calendar/0/deeplink/compose';
		const params = new URLSearchParams({
			path: '/calendar/action/compose',
			startdt: event.start,
			enddt: event.end,
			subject: event.title,
			body: event.description,
			location: event.location
		});
		return `${baseUrl}?${params.toString()}`;
	};

	// Generate .ics file for Apple Calendar
	const downloadICSFile = (e: Event, event) => {
		e.preventDefault();

		const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
DTSTART:${new Date(event.start).toISOString().replace(/[-:.]/g, '').slice(0, -4)}Z
DTEND:${new Date(event.end).toISOString().replace(/[-:.]/g, '').slice(0, -4)}Z
END:VEVENT
END:VCALENDAR`;

		const blob = new Blob([icsContent], { type: 'text/calendar' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `${event.title}.ics`;
		link.click();
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button variant="outline" class="mt-4"><CalendarPlus/></Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Item
				onclick={(e) => window.open(getGoogleCalendarLink(e, eventDetails), '_blank')}
			>
				Google Calendar
			</DropdownMenu.Item>
			<DropdownMenu.Item
				onclick={(e) => window.open(getOutlookCalendarLink(e, eventDetails), '_blank')}
			>
				Outlook Calendar
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={(e) => downloadICSFile(e, eventDetails)}>
				Apple Calendar (.ics)
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
