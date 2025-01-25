import * as Sentry from '@sentry/sveltekit';
import { tempAttendeeSecretStore, tempAttendeeSecretParam } from '$lib/enums';
import type { HandleFetch } from '@sveltejs/kit';
import { dev } from '$app/environment';

if (!dev) {
	// If you don't want to use Session Replay, remove the `Replay` integration,
	// `replaysSessionSampleRate` and `replaysOnErrorSampleRate` options.
	Sentry.init({
		dsn: 'https://3b8c1776298855f9184a78a5d271ec6d@o4505031789314048.ingest.us.sentry.io/4508626481774592',
		tracesSampleRate: 1,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1,
		integrations: [Sentry.replayIntegration()]
	});
}

export const handleFetch: HandleFetch = async ({ request, fetch }) => {
	// Check if tempAttendeeId exists in the store
	const tempAttendeeId = tempAttendeeSecretStore.get();

	if (tempAttendeeId) {
		const url = new URL(request.url);

		// Add the tempAttendeeId parameter if it's not already present
		if (!url.searchParams.has(tempAttendeeSecretParam)) {
			url.searchParams.set(tempAttendeeSecretParam, tempAttendeeId);
		}

		// Clone the request with the updated URL
		request = new Request(url.toString(), request);
	}

	// Perform the modified fetch
	return fetch(request);
};
export const handleError = Sentry.handleErrorWithSentry();
