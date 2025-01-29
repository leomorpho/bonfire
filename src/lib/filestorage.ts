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
import { and, HttpClient } from '@triplit/client';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { encode } from 'blurhash';
import fs from 'fs/promises';
import path from 'path';
import { getPixels } from '@unpic/pixels';
import { BannerMediaSize } from './enums';
import { createReadStream } from 'fs';
import { createNewFileNotificationQueueObject } from './notification';

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

/**
 * Runs file processing for uploaded images & videos.
 * @param {string} filePath - The path of the uploaded file.
 * @param {string} filename - The original filename.
 * @param {string} filetype - MIME type of the file.
 * @param {string} userId - The ID of the uploader (either user or temp attendee).
 * @param {string} eventId - The event ID associated with the upload.
 * @returns {Promise<void>}
 */
export async function processGalleryFile(
	filePath: string,
	filename: string,
	filetype: string,
	userId: string | null,
	tempAttendeeId: string | null,
	eventId: string
) {
	try {
		if (!userId && !tempAttendeeId) {
			return Error('either userId or tempAttendeeId must be set');
		}

		const fileKey = `events/eventid_${eventId}/userid_${userId}/${filename}`;
		let frameFileId = null;
		let h_pixel: number | null = null;
		let w_pixel: number | null = null;
		let blurhash: string | null = null;
		let cleanup: (() => Promise<void>) | null = null;

		if (filetype.startsWith('image/')) {
			// ✅ Process Image
			const metadata = await sharp(filePath).metadata();
			h_pixel = metadata.height || null;
			w_pixel = metadata.width || null;

			// Generate BlurHash
			try {
				const processedBuffer = await sharp(filePath).toFormat('png').toBuffer();
				const pixelData = await getPixels(processedBuffer);
				const data = Uint8ClampedArray.from(pixelData.data);
				blurhash = encode(data, pixelData.width, pixelData.height, 4, 4);
			} catch (e) {
				console.log('❌ Failed to generate BlurHash:', e);
			}

			// Upload to S3
			await uploadLargeFileToS3({
				fileStream: createReadStream(filePath),
				key: fileKey,
				contentType: filetype
			});
		} else if (filetype.startsWith('video/')) {
			// ✅ Process Video
			try {
				const {
					blurhash: videoBlurHash,
					tempImagePath,
					cleanup: tempCleanup
				} = await extractFirstFrameAndBlurHash(filePath);
				cleanup = tempCleanup;
				blurhash = videoBlurHash;

				// Extract metadata for video frame
				const frameMetadata = await sharp(tempImagePath).metadata();
				h_pixel = frameMetadata.height || null;
				w_pixel = frameMetadata.width || null;

				// Upload extracted frame
				const frameFileKey = `events/eventid_${eventId}/userid_${userId}/frame-${filename}`;
				await uploadLargeFileToS3({
					fileStream: createReadStream(tempImagePath),
					key: frameFileKey,
					contentType: 'image/png'
				});

				// Store frame file in DB
				const { output } = await triplitHttpClient.insert('files', {
					uploader_id: userId,
					temp_uploader_id: tempAttendeeId,
					event_id: eventId,
					file_key: frameFileKey,
					file_type: 'image/png',
					file_name: `frame-${filename}`,
					size_in_bytes: (await fs.stat(tempImagePath)).size,
					h_pixel: h_pixel,
					w_pixel: w_pixel,
					blurr_hash: videoBlurHash,
					is_linked_file: true
				});
				frameFileId = output.id;
			} catch (err) {
				console.error('❌ Failed to process video:', err);
			} finally {
				if (cleanup) await cleanup();
			}

			// Transcode and upload video
			await transcodeAndUploadVideo(filePath, fileKey);
		}

		// ✅ Store file metadata in database
		const { output } = await triplitHttpClient.insert('files', {
			uploader_id: userId,
			temp_uploader_id: tempAttendeeId,
			event_id: eventId,
			file_key: fileKey,
			file_type: filetype,
			file_name: filename,
			size_in_bytes: (await await fs.stat(filePath)).size,
			h_pixel,
			w_pixel,
			blurr_hash: blurhash,
			linked_file_id: frameFileId ?? null
		});

		await createNewFileNotificationQueueObject(
			triplitHttpClient as HttpClient,
			userId ?? (tempAttendeeId as string),
			eventId,
			[output?.id as string]
		);

		console.log(`✅ Successfully processed file: ${filePath}`);
	} catch (error) {
		console.error(`❌ Error processing uploaded file: ${error}`);
	} finally {
		// TODO clean up all temp files
	}
}

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
			e.blurr_hash = blurhash;
		});
	} else {
		// Insert a new entry
		await triplitHttpClient.insert('profile_images', {
			user_id: userId,
			full_image_key: fullImageKey,
			small_image_key: smallImageKey,
			blurr_hash: blurhash
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
	verifyAccess: boolean,
	numFiles: number | null = null
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

	// If user is logged in, they must have a valid attendance
	if (userId) {
		try {
			const attendance = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('attendees')
					.where([
						and([
							['user_id', '=', userId],
							['event_id', '=', bonfireId]
						])
					])
					.build()
			);
			// console.log('attendance --->', attendance);
			if (!attendance) {
				return;
			}
		} catch (e) {
			console.error('failed to fetch attendance object', e);
		}
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
	let filesQuery = triplitHttpClient
		.query('files')
		.where(
			and([
				['event_id', '=', bonfireId],
				['is_linked_file', '=', false]
			])
		)
		.include('linked_file')
		.order('uploaded_at', 'DESC');
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
	// .build();

	if (numFiles) {
		filesQuery = filesQuery.limit(numFiles);
	}
	const files = await triplitHttpClient.fetch(filesQuery.build());

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

/**
 * Transcode a video file to a streamable MP4 format and upload it to S3.
 * @param videoPath - The file path to the video file.
 * @param outputKey - S3 key for the transcoded file.
 * @returns {Promise<string>} - The S3 key of the uploaded file.
 */
export async function transcodeAndUploadVideo(
	videoPath: string,
	outputKey: string
): Promise<string> {
	const tempDir = path.join(process.cwd(), 'temp');
	await fs.mkdir(tempDir, { recursive: true }); // Ensure temp directory exists

	const tempOutputPath = path.join(tempDir, `transcoded-${Date.now()}.mp4`);

	try {
		// Transcode the video to MP4 (H.264/AAC)
		await new Promise<void>((resolve, reject) => {
			ffmpeg(videoPath)
				.output(tempOutputPath)
				.videoCodec('libx264')
				.audioCodec('aac')
				.format('mp4')
				.outputOptions('-movflags +faststart') // Optimize for streaming
				.on('end', () => resolve())
				.on('error', (err) => reject(err))
				.run();
		});

		// Read the transcoded file into a stream
		const transcodedBuffer = await fs.readFile(tempOutputPath);
		const fileStream = Readable.from(transcodedBuffer);

		// Upload the transcoded file to S3
		await uploadLargeFileToS3({
			fileStream,
			key: outputKey,
			contentType: 'video/mp4'
		});

		console.log(`Successfully uploaded transcoded video to S3: ${outputKey}`);
		return outputKey;
	} catch (error) {
		console.error('Error during transcoding/upload process:', error);
		throw error;
	} finally {
		// Clean up temporary files
		await fs.unlink(tempOutputPath).catch(() => console.warn('Failed to delete temp output file'));
	}
}

/**
 * Extract the first frame from a video and generate a BlurHash.
 * This function processes a video file from a given file path and cleans up temporary files.
 *
 * @param videoPath - The file path to the video.
 * @returns {Promise<{ blurhash: string; tempImagePath: string; cleanup: () => Promise<void> }>} - The generated BlurHash for the first frame.
 */
export async function extractFirstFrameAndBlurHash(
	videoPath: string
): Promise<{ blurhash: string; tempImagePath: string; cleanup: () => Promise<void> }> {
	// Define the local temp directory
	const tempDir = path.join(process.cwd(), 'temp');
	await fs.mkdir(tempDir, { recursive: true }); // Ensure the temp directory exists

	// Delete files older than 1 hour
	await cleanOldTempFiles(tempDir);

	// Define the path for the temporary frame file
	const tempImagePath = path.join(tempDir, `temp-frame-${Date.now()}.png`);

	try {
		// Get the video duration
		const durationInSeconds = await getVideoDuration(videoPath);

		// Generate a random timestamp within the video duration
		const randomTimestamp = (Math.random() * durationInSeconds).toFixed(2); // e.g., "12.34"

		// Use FFmpeg to extract the random frame
		await new Promise<void>((resolve, reject) => {
			ffmpeg(videoPath)
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
				await fs
					.unlink(tempImagePath)
					.catch(() => console.warn('Failed to delete temp frame file'));
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
