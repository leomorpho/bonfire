import { redirect } from '@sveltejs/kit';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { PUBLIC_S3_BONFIRE_PUCLIC_BUCKET_NAME } from '$env/static/public';
import { createHash } from 'crypto';
import { env } from '$env/dynamic/private';
import { triplitHttpClient } from '$lib/server/triplit.js';

// Create an S3 client
const s3 = new S3Client({
	region: env.S3_REGION, // Your Backblaze region
	endpoint: env.S3_ENDPOINT,
	credentials: {
		accessKeyId: env.S3_BONFIRE_PUBLIC_ACCESS_KEY_ID,
		secretAccessKey: env.S3_BONFIRE_PUBLIC_SECRET_ACCESS_KEY
	}
});

const bucketName = PUBLIC_S3_BONFIRE_PUCLIC_BUCKET_NAME;

/**
 * List all files in a specified directory (prefix) in the S3 bucket.
 * Filters only image and video files based on their extensions.
 * Ensures unique filenames and generates a hash-based ID for each file.
 *
 * @param prefix - The directory or prefix to list files from (e.g., 'profile-images/')
 * @returns {Promise<{ id: string; fileKey: string }[]>} - An array of objects containing IDs and file keys.
 */
async function listFilesInDirectory(prefix: string): Promise<{ id: string; fileKey: string }[]> {
	try {
		const command = new ListObjectsV2Command({
			Bucket: bucketName,
			Prefix: prefix
		});

		const result = await s3.send(command);

		// Extract the keys of the objects and filter for images/videos
		const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.avi', '.webm'];
		const files = (result.Contents || [])
			.map((item) => item.Key)
			.filter((key): key is string => !!key) // Ensure keys are not undefined
			.filter((key) => validExtensions.some((ext) => key.toLowerCase().endsWith(ext))); // Filter by extensions

		// Enforce unique filenames and generate IDs
		const uniqueFiles = Array.from(new Set(files)); // Deduplicate
		const filesWithIds = uniqueFiles.map((fileKey) => ({
			id: createHash('sha256').update(fileKey).digest('hex'), // Generate hash-based ID
			fileKey
		}));

		console.log(`Files in ${prefix}:`, filesWithIds);
		return filesWithIds;
	} catch (error) {
		console.error('Error listing files in directory:', error);
		throw error;
	}
}

/**
 * Inserts missing seamless tiles into the database.
 * Queries S3 for all seamless pattern files, checks the seamless_tiles table,
 * and inserts missing entries.
 */
async function syncSeamlessTiles(files: { id: string; fileKey: string }[]) {
	try {
		// Query the database for existing seamless tile IDs
		const existingTiles = await triplitHttpClient.fetch(
			triplitHttpClient.query('seamless_tiles').select(['id']).build()
		);

		// Extract IDs of existing tiles
		const existingIds = new Set(existingTiles.map((tile: { id: string }) => tile.id));

		// Filter files to find those not already in the database
		const newFiles = files.filter((file) => !existingIds.has(file.id));

		// Insert new files into the database
		await Promise.all(
			newFiles.map(async (file) => {
				await triplitHttpClient.insert('seamless_tiles', {
					id: file.id,
					url: file.fileKey,
					css_template: `url("${file.fileKey}")`,
					name:  null, // Default to null; can be updated later
					enabled_in_prod: false // Default to disabled in production
				});
			})
		);

		console.log(`${newFiles.length} new seamless tiles added.`);
		return { success: true, added: newFiles.length };
	} catch (error) {
		console.error('Error syncing seamless tiles:', error);
		throw error;
	}
}

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	if (!user || !user.is_event_styles_admin) {
		throw redirect(302, '/');
	}

	const prefix = 'seamless-patterns/'; // Replace with your directory path
	const files = await listFilesInDirectory(prefix);

	// Sync seamless tiles in the database
	await syncSeamlessTiles(files);

	return {
		user: user
	};
};
