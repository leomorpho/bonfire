import {
	S3Client,
	PutObjectCommand,
	CreateMultipartUploadCommand,
	UploadPartCommand,
	CompleteMultipartUploadCommand,
	AbortMultipartUploadCommand,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';
import sharp from 'sharp'; // For resizing images
import { dev } from '$app/environment';
import { Readable } from 'stream';
import { triplitHttpClient } from '$lib/server/triplit';
import { and } from '@triplit/client';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { encode } from 'blurhash';
import fs from 'fs/promises';
import path from 'path';
import { getPixels } from '@unpic/pixels';
import { BannerMediaSize } from './enums';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Create an S3 client
const s3 = new S3Client({
	region: env.S3_REGION, // Your Backblaze region
	endpoint: env.S3_ENDPOINT,
	credentials: {
		accessKeyId: dev ? env.DEV_S3_ACCESS_KEY_ID : env.S3_ACCESS_KEY_ID,
		secretAccessKey: dev ? env.DEV_S3_SECRET_ACCESS_KEY : env.S3_SECRET_ACCESS_KEY
	}
});

const bucketName = dev ? env.DEV_S3_BUCKET_NAME : env.S3_BUCKET_NAME;

export async function uploadProfileImage(file: File, userId: string) {
	// NOTE: Profile pics are always named the same for a same user, to overwrite their previous pic.

	// Generate keys
	const fullImageKey = `profile-images/${userId}/full.jpg`;
	const smallImageKey = `profile-images/${userId}/small.jpg`;

	// Convert File to Buffer
	const fileBuffer = Buffer.from(await file.arrayBuffer());

	// Generate BlurHash for the small image
	let blurhash: string | null = null;
	try {
		const pixelData = await getPixels(fileBuffer);
		const data = Uint8ClampedArray.from(pixelData.data);
		blurhash = encode(data, pixelData.width, pixelData.height, 4, 4);
	} catch (error) {
		console.error('Failed to generate BlurHash:', error);
	}

	// Resize the image for the full version (400x400)
	const fullImageBuffer = await sharp(fileBuffer)
		.resize(400, 400, { fit: 'cover' }) // Crop to fit within 400x400
		.jpeg({ quality: 90 }) // High quality for full version
		.toBuffer();

	// Resize the image for the small version (128x128)
	const smallImageBuffer = await sharp(fileBuffer)
		.resize(128, 128, { fit: 'cover' }) // Crop to fit within 128x128
		.jpeg({ quality: 80 }) // Lower quality for small version
		.toBuffer();

	// Upload full version
	await s3.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key: fullImageKey,
			Body: fullImageBuffer,
			ContentType: 'image/jpeg',
			ACL: 'private'
		})
	);

	// Upload small version
	await s3.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key: smallImageKey,
			Body: smallImageBuffer,
			ContentType: 'image/jpeg',
			ACL: 'private'
		})
	);

	// Check if a profile image entry exists for the user
	const query = triplitHttpClient
		.query('profile_images')
		.where(['user_id', '=', userId])
		// .select(['id']) // TODO: bug with select for http client
		.build();

	const existingEntry = await triplitHttpClient.fetchOne(query);

	if (existingEntry) {
		// Update the existing entry
		await triplitHttpClient.update('profile_images', existingEntry.id, async (e) => {
			e.full_image_key = fullImageKey;
			e.small_image_key = smallImageKey;
			e.blurhash = blurhash;
		});
	} else {
		// Insert a new entry
		await triplitHttpClient.insert('profile_images', {
			user_id: userId,
			full_image_key: fullImageKey,
			small_image_key: smallImageKey,
			blurhash: blurhash
		});
	}

	return { fullImageKey, smallImageKey };
}

export async function uploadBannerImage(file: File, userId: string, eventId: string) {
	// Extract file metadata
	const filetype = file.type; // MIME type, e.g., 'image/jpeg'
	const filesize = file.size; // File size in bytes

	// Generate keys
	const largeImageKey = `banner/${eventId}/lg.jpg`;
	const smallImageKey = `banner/${eventId}/sm.jpg`;

	// Convert File to Buffer
	const fileBuffer = Buffer.from(await file.arrayBuffer());

	// Resize the image for the full version (400x400)
	const largeImageBuffer = await sharp(fileBuffer)
		.resize(BannerMediaSize.LARGE_WIDTH, BannerMediaSize.LARGE_HEIGHT, { fit: 'cover' })
		.jpeg({ quality: 90 }) // High quality for full version
		.toBuffer();

	// Resize the image for the small version (128x128)
	const smallImageBuffer = await sharp(fileBuffer)
		.resize(BannerMediaSize.SMALL_WIDTH, BannerMediaSize.SMALL_HEIGHT, { fit: 'cover' })
		.jpeg({ quality: 80 }) // Lower quality for small version
		.toBuffer();

	// Generate BlurHash for the small image
	let blurhash: string | null = null;
	try {
		const pixelData = await getPixels(smallImageBuffer);
		const data = Uint8ClampedArray.from(pixelData.data);
		blurhash = encode(data, pixelData.width, pixelData.height, 4, 4);
	} catch (error) {
		console.error('Failed to generate BlurHash:', error);
	}

	// Upload large version
	await s3.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key: largeImageKey,
			Body: largeImageBuffer,
			ContentType: 'image/jpeg',
			ACL: 'private'
		})
	);

	// Upload small version
	await s3.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key: smallImageKey,
			Body: smallImageBuffer,
			ContentType: 'image/jpeg',
			ACL: 'private'
		})
	);

	// Check if a profile image entry exists for the user
	const query = triplitHttpClient
		.query('banner_media')
		.where(['event_id', '=', eventId])
		// .select(['id']) // TODO: bug with select for http client
		.build();

	const existingEntry = await triplitHttpClient.fetchOne(query);

	if (existingEntry) {
		// Update the existing entry
		await triplitHttpClient.update('banner_media', existingEntry.id, async (e) => {
			e.full_image_key = largeImageKey;
			e.small_image_key = smallImageKey;
			e.file_type = filetype;
			e.h_pixel_lg = BannerMediaSize.LARGE_HEIGHT;
			e.w_pixel_lg = BannerMediaSize.LARGE_WIDTH;
			e.h_pixel_sm = BannerMediaSize.SMALL_HEIGHT;
			e.w_pixel_sm = BannerMediaSize.SMALL_WIDTH;
			e.blurr_hash = blurhash;
			e.size_in_bytes = filesize;
			e.uploader_id = userId;
			e.event_id = eventId;
		});
	} else {
		// Insert a new entry
		await triplitHttpClient.insert('banner_media', {
			full_image_key: smallImageKey,
			small_image_key: smallImageKey,
			file_type: filetype,
			h_pixel_lg: BannerMediaSize.LARGE_HEIGHT,
			w_pixel_lg: BannerMediaSize.LARGE_WIDTH,
			h_pixel_sm: BannerMediaSize.SMALL_HEIGHT,
			w_pixel_sm: BannerMediaSize.SMALL_WIDTH,
			blurr_hash: blurhash,
			size_in_bytes: filesize,
			uploader_id: userId,
			event_id: eventId
		});
	}

	return { largeImageKey, smallImageKey };
}

export async function generateSignedUrl(key: string, expiresIn = 3600 * 24) {
	try {
		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: key
		});

		const signedUrl = await getSignedUrl(s3, command, { expiresIn });

		return signedUrl;
	} catch (error) {
		console.error('Error generating signed URL:', error);
		throw error;
	}
}

// Define types for the parameters
interface UploadLargeFileToS3Params {
	fileStream: Readable; // A readable stream for the file
	key: string; // The S3 object key
	contentType: string; // The MIME type of the file
}

// Define types for the function return value
interface UploadLargeFileToS3Result {
	success: boolean;
	key: string;
}

export async function uploadLargeFileToS3({
	fileStream,
	key,
	contentType
}: UploadLargeFileToS3Params): Promise<UploadLargeFileToS3Result> {
	const chunkSize = 8 * 1024 * 1024; // 8MB

	let uploadId: string | undefined;
	const parts: { PartNumber: number; ETag: string }[] = [];
	let partNumber = 1;

	try {
		// Start the multipart upload
		const createCommand = new CreateMultipartUploadCommand({
			Bucket: bucketName,
			Key: key,
			ContentType: contentType
		});
		const createResponse = await s3.send(createCommand);
		uploadId = createResponse.UploadId;

		if (!uploadId) {
			throw new Error('Failed to start multipart upload');
		}

		// Read and upload chunks
		for await (const chunk of chunkFileStream(fileStream, chunkSize)) {
			const uploadPartCommand = new UploadPartCommand({
				Bucket: bucketName,
				Key: key,
				PartNumber: partNumber,
				UploadId: uploadId,
				Body: chunk
			});
			const partResponse = await s3.send(uploadPartCommand);

			if (!partResponse.ETag) {
				throw new Error(`Failed to upload part ${partNumber}`);
			}

			parts.push({ PartNumber: partNumber, ETag: partResponse.ETag });
			partNumber++;
		}

		// Complete the upload
		const completeCommand = new CompleteMultipartUploadCommand({
			Bucket: bucketName,
			Key: key,
			UploadId: uploadId,
			MultipartUpload: { Parts: parts }
		});
		await s3.send(completeCommand);

		console.log(`File uploaded successfully: ${key}`);
		return { success: true, key };
	} catch (error) {
		console.error(`Error uploading file: ${error}`);

		// Abort the upload on failure
		if (uploadId) {
			const abortCommand = new AbortMultipartUploadCommand({
				Bucket: bucketName,
				Key: key,
				UploadId: uploadId
			});
			await s3.send(abortCommand);
			console.error(`Multipart upload aborted: ${key}`);
		}

		throw error;
	}
}

// Function to chunk a readable stream
async function* chunkFileStream(fileStream: Readable, chunkSize: number): AsyncIterable<Buffer> {
	let buffer = Buffer.alloc(0);

	for await (const chunk of fileStream) {
		buffer = Buffer.concat([buffer, chunk]);

		while (buffer.length >= chunkSize) {
			const chunkToYield = buffer.subarray(0, chunkSize); // Use subarray instead of slice
			yield Buffer.from(chunkToYield); // Convert to Buffer
			buffer = buffer.subarray(chunkSize); // Update buffer with remaining data
		}
	}

	if (buffer.length > 0) {
		yield Buffer.from(buffer); // Yield remaining data as a new Buffer
	}
}

/**
 * Deletes multiple files from S3 by their keys.
 *
 * @param {string[]} fileKeys - Array of S3 object keys to delete.
 * @returns {Promise<{ success: boolean; deleted: string[]; failed: string[] }>} - Result of the deletion.
 */
export async function deleteFilesFromS3(fileKeys: string[]): Promise<{
	success: boolean;
	deleted: string[];
	failed: string[];
}> {
	if (fileKeys.length === 0) {
		return { success: false, deleted: [], failed: ['No file keys provided.'] };
	}

	const results = await Promise.allSettled(
		fileKeys.map(async (fileKey) => {
			try {
				const deleteCommand = new DeleteObjectCommand({
					Bucket: bucketName,
					Key: fileKey
				});

				await s3.send(deleteCommand);
				return { success: true, fileKey };
			} catch (error) {
				console.error(`Error deleting file ${fileKey}:`, error);
				return { success: false, fileKey };
			}
		})
	);

	// Separate successful and failed operations
	const deleted = results
		.filter((result) => result.status === 'fulfilled' && result.value.success)
		.map(
			(result) =>
				(result as PromiseFulfilledResult<{ success: boolean; fileKey: string }>).value.fileKey
		);

	const failed = results
		.filter((result) => result.status === 'fulfilled' && !result.value.success)
		.map(
			(result) =>
				(result as PromiseFulfilledResult<{ success: boolean; fileKey: string }>).value.fileKey
		);

	const failedDueToErrors = results
		.filter((result) => result.status === 'rejected')
		.map((result) => (result as PromiseRejectedResult).reason);

	return {
		success: failed.length === 0 && failedDueToErrors.length === 0,
		deleted,
		failed: [...failed, ...failedDueToErrors]
	};
}

/**
 * Fetches accessible event files for a user and bonfire ID, and checks ownership.
 * @param {string} bonfireId - The ID of the bonfire/event.
 * @param {Object} user - The user object from locals.
 * @returns {Promise<{ files: Array, isOwner: boolean }>} - An object containing the event files with signed URLs and ownership status.
 * @throws {Error} - If the user is unauthorized or the bonfire does not exist.
 */
export async function fetchAccessibleEventFiles(
	bonfireId: string,
	userId: string | null | undefined,
	tempAttendeeId: string | null | undefined,
	verifyAccess: boolean
) {
	let existingAttendee = null;

	if (tempAttendeeId && verifyAccess) {
		existingAttendee = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('temporary_attendees')
				.where([
					and([
						['id', '=', tempAttendeeId],
						['event_id', '=', bonfireId]
					])
				])
				.build()
		);
	}
	if (verifyAccess && !userId && !existingAttendee) {
		throw new Error('Unauthorized'); // Explicitly handle unauthorized access
	}

	// Fetch event details to determine ownership
	const eventQuery = triplitHttpClient
		.query('events')
		.where(['id', '=', bonfireId])
		// .select(['user_id']) // TODO: bug with select for http client
		.build();
	const event = await triplitHttpClient.fetch(eventQuery);

	if (!event) {
		throw new Error('Bonfire not found'); // Explicitly handle missing event
	}

	// Check if the user is the event owner
	const isOwner = event.user_id === userId;

	// Fetch files related to the bonfire
	const filesQuery = triplitHttpClient
		.query('files')
		.where(
			and([
				['event_id', '=', bonfireId],
				['is_linked_file', '=', false]
			])
		)
		.include('linked_file')
		.order('uploaded_at', 'DESC')
		// .select([
		// 	'id',
		// 	'file_key',
		// 	'file_type',
		// 	'uploader_id',
		// 	'h_pixel',
		// 	'w_pixel',
		// 	'size_in_bytes',
		// 	'uploaded_at'
		// ]) // Include necessary fields // TODO: bug with select for http client
		.build();
	const files = await triplitHttpClient.fetch(filesQuery);

	// Generate signed URLs for the files, including linked files
	const filesWithUrls = await Promise.all(
		files.map(async (file) => {
			// Generate signed URL for the main file
			const signedFileUrl = await generateSignedUrl(file.file_key);

			// If the file has a linked_file, generate signed URL for the linked file
			let linkedFileUrl = null;
			if (file.linked_file) {
				linkedFileUrl = await generateSignedUrl(file.linked_file.file_key);
			}

			return {
				...file,
				URL: signedFileUrl,
				linked_file: file.linked_file ? { ...file.linked_file, URL: linkedFileUrl } : null
			};
		})
	);

	return { files: filesWithUrls, isOwner };
}

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Extract the first frame from a video saved in a local temp directory and generate a BlurHash.
 * This function saves the video file to a `temp` directory within the project, processes it, and cleans up.
 *
 * @param videoBuffer - The video file as a Buffer.
 * @returns {Promise<string>} - The generated BlurHash for the first frame.
 */
export async function extractFirstFrameAndBlurHash(
	videoBuffer: Buffer
): Promise<{ blurhash: string; tempImagePath: string; cleanup: () => Promise<void> }> {
	// Define the local temp directory
	const tempDir = path.join(process.cwd(), 'temp');
	await fs.mkdir(tempDir, { recursive: true }); // Ensure the temp directory exists

	// Delete files older than 1 hour
	await cleanOldTempFiles(tempDir);

	// Define paths for the temporary video and frame files
	const tempVideoPath = path.join(tempDir, `temp-video-${Date.now()}.mov`);
	const tempImagePath = path.join(tempDir, `temp-frame-${Date.now()}.png`);

	try {
		// Save the video buffer to a temporary file
		await fs.writeFile(tempVideoPath, videoBuffer);
		console.log(`Video saved temporarily at: ${tempVideoPath}`);

		const durationInSeconds = await getVideoDuration(tempVideoPath);

		// Generate a random timestamp within the video duration
		const randomTimestamp = (Math.random() * durationInSeconds).toFixed(2); // e.g., "12.34"

		// Use FFmpeg to extract the random frame
		await new Promise<void>((resolve, reject) => {
			ffmpeg(tempVideoPath)
				.seekInput(randomTimestamp) // Seek to the random timestamp
				.frames(1)
				.output(tempImagePath)
				.on('end', () => {
					console.log(`Random frame extracted temporarily at: ${tempImagePath}`);
					resolve();
				})
				.on('error', (err) => {
					console.error('FFmpeg error during frame extraction:', err);
					reject(err);
				})
				.run();
		});

		// Read and process the extracted frame
		const imageBuffer = await fs.readFile(tempImagePath);
		const processedBuffer = await sharp(imageBuffer).resize(32, 32).raw().ensureAlpha().toBuffer();

		const blurhash = encode(new Uint8ClampedArray(processedBuffer), 32, 32, 4, 4);

		// Return the blurhash, temp image path, and a cleanup closure
		return {
			blurhash,
			tempImagePath,
			cleanup: async () => {
				await Promise.all([
					fs.unlink(tempVideoPath).catch(() => console.warn('Failed to delete temp video file')),
					fs.unlink(tempImagePath).catch(() => console.warn('Failed to delete temp frame file'))
				]);
			}
		};
	} catch (err) {
		console.error('Error during frame extraction or BlurHash generation:', err);
		throw err;
	}
}

/**
 * Get the duration of a video using FFprobe.
 * @param videoPath - Path to the video file.
 * @returns {Promise<number>} - Duration of the video in seconds.
 */
async function getVideoDuration(videoPath: string): Promise<number> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(videoPath, (err, metadata) => {
			if (err) {
				reject(err);
			} else {
				const duration = metadata.format.duration;
				if (duration) {
					resolve(duration);
				} else {
					reject(new Error('Unable to determine video duration'));
				}
			}
		});
	});
}

/**
 * Clean up files in the temp directory that are older than 1 hour.
 * @param tempDir - Path to the temp directory.
 */
async function cleanOldTempFiles(tempDir: string): Promise<void> {
	try {
		const files = await fs.readdir(tempDir);

		const oneHourAgo = Date.now() - 60 * 60 * 1000;

		await Promise.all(
			files.map(async (file) => {
				const filePath = path.join(tempDir, file);
				try {
					const stats = await fs.stat(filePath);

					// Check if the file was modified more than 1 hour ago
					if (stats.mtimeMs < oneHourAgo) {
						await fs.unlink(filePath);
						console.log(`Deleted old temp file: ${filePath}`);
					}
				} catch (err) {
					console.warn(`Failed to process file for cleanup: ${filePath}`, err);
				}
			})
		);
	} catch (err) {
		console.warn('Failed to clean old temp files:', err);
	}
}
