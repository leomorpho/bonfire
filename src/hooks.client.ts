import { tempAttendeeIdStore, tempAttendeeIdUrlParam } from '$lib/enums';
import type { HandleFetch } from '@sveltejs/kit';

export const handleFetch: HandleFetch = async ({ request, fetch }) => {
    console.log("HANDLE FGETCH")
    // Check if tempAttendeeId exists in the store
    const tempAttendeeId = tempAttendeeIdStore.get();

    if (tempAttendeeId) {
        const url = new URL(request.url);

        // Add the tempAttendeeId parameter if it's not already present
        if (!url.searchParams.has(tempAttendeeIdUrlParam)) {
            url.searchParams.set(tempAttendeeIdUrlParam, tempAttendeeId);
        }

        // Clone the request with the updated URL
        request = new Request(url.toString(), request);
    }

    // Perform the modified fetch
    return fetch(request);
};