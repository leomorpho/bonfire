import { redirect } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { tempAttendeeSecretParam } from '$lib/enums';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Create an S3 client
const s3Client = new S3Client({
	region: env.S3_REGION, // Your Backblaze region
	endpoint: env.S3_ENDPOINT,
	credentials: {
		accessKeyId: dev ? env.DEV_S3_ACCESS_KEY_ID : env.S3_ACCESS_KEY_ID,
		secretAccessKey: dev ? env.DEV_S3_SECRET_ACCESS_KEY : env.S3_SECRET_ACCESS_KEY
	}
});

export const POST = async ({ url, locals, params, request }): Promise<Response> => {
	const tempAttendeeSecret = url.searchParams.get(tempAttendeeSecretParam);

	let tempAttendeeExists: boolean = false;
	let existingTempAttendee = null;

	try {
		if (tempAttendeeSecret) {
			try {
				existingTempAttendee = await triplitHttpClient.fetchOne(
					triplitHttpClient
						.query('temporary_attendees')
						.where(['secret_mapping.id', '=', tempAttendeeSecret])
						.build()
				);
				if (existingTempAttendee) {
					tempAttendeeExists = true;
				}
			} catch (e) {
				console.debug('failed to find temp attendee because it does not exist', e);
			}
		}
	} catch (error) {
		console.error(`Error checking for temp attendee with secret ${tempAttendeeSecret}:`, error);
		return new Response('Internal Server Error', { status: 500 });
	}

	try {
		const user = locals.user;

		if (!user && !tempAttendeeExists) {
			redirect(302, '/login');
		}

		const { id: eventId } = params;
		if (!eventId) {
			return new Response('Missing event ID', { status: 400 });
		}

		const { filename, contentType, size } = await request.json();
		if (!filename || !contentType || !size) {
			return new Response('Missing required metadata', { status: 400 });
		}

		const bucketName = dev ? env.DEV_S3_BUCKET_NAME : env.S3_BUCKET_NAME;

		let fileKey = '';

		if (user) {
			fileKey = `events/eventid_${eventId}/userid_${user?.id}/${filename}`;
		} else {
			fileKey = `events/eventid_${eventId}/tempid_${existingTempAttendee?.id}/${filename}`;
		}

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: fileKey,
			ContentType: contentType
		});

		const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

		return new Response(
			JSON.stringify({
				uploadURL,
				fileKey,
				existingTempAttendeeId: existingTempAttendee?.id
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Error generating pre-signed URL:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
};
