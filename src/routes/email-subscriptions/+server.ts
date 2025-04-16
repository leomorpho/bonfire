import { triplitHttpClient } from '$lib/server/triplit';
import { toggleDeliveryPermission } from '$lib/permissions'; // Assuming this function toggles the delivery permission
import { json } from '@sveltejs/kit';
import { verifyUnsubscribableEmailAuditTrailEntry } from '$lib/server/email/email';
import { DeliveryPermissions } from '$lib/enums';

export const GET = async ({ url }) => {
	// Extract query parameters
	const userId = url.searchParams.get('userId');
	const eventId = url.searchParams.get('eventId');
	const code = url.searchParams.get('code');

	if (!code || !userId) {
		return json({ error: 'Missing userId or code' }, { status: 400 });
	}

	// Verify the secret token
	const isRequestValid = await verifyUnsubscribableEmailAuditTrailEntry(code, userId);
	if (!isRequestValid) {
		return json({ error: 'Invalid or expired code' }, { status: 400 });
	}

	try {
		// Toggle the delivery permission
		await toggleDeliveryPermission(
			triplitHttpClient,
			userId,
			DeliveryPermissions.email_notifications,
			false,
			eventId
		);

		return json({ success: true, message: 'Unsubscribed successfully' });
	} catch (err) {
		console.error('Error processing unsubscription:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
