import {
	S3Client,
	PutObjectCommand,
	CreateMultipartUploadCommand,
	UploadPartCommand,
	CompleteMultipartUploadCommand,
	AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';
import sharp from 'sharp'; // For resizing images
import { serverTriplitClient } from './triplit';
import { dev } from '$app/environment';
import { Readable } from 'stream';

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

export async function uploadProfileImageToS3(file: File, userId: string) {
	// Generate keys
	const fullImageKey = `profile-images/${userId}/full.jpg`;
	const smallImageKey = `profile-images/${userId}/small.jpg`;

	// Convert File to Buffer
	const fileBuffer = Buffer.from(await file.arrayBuffer());

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
	const query = serverTriplitClient
		.query('profile_images')
		.where(['user_id', '=', userId])
		.select(['id'])
		.build();

	let existingEntry = await serverTriplitClient.fetchOne(query);

	if (existingEntry) {
		// Update the existing entry
		await serverTriplitClient.update('profile_images', existingEntry.id, async (e) => {
			e.full_image_key = fullImageKey;
			e.small_image_key = smallImageKey;
		});
	} else {
		// Insert a new entry
		await serverTriplitClient.insert('profile_images', {
			user_id: userId,
			full_image_key: fullImageKey,
			small_image_key: smallImageKey
		});
	}

	return { fullImageKey, smallImageKey };
}

export async function generateSignedUrl(key: string, expiresIn = 3600) {
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
	contentType,
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
		ContentType: contentType,
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
		  Body: chunk,
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
		MultipartUpload: { Parts: parts },
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
		  UploadId: uploadId,
		});
		await s3.send(abortCommand);
		console.error(`Multipart upload aborted: ${key}`);
	  }
  
	  throw error;
	}
  }
  
  // Utility function to chunk the stream
  async function* chunkFileStream(
	fileStream: Readable,
	chunkSize: number
  ): AsyncIterable<Buffer> {
	let buffer = Buffer.alloc(0);
  
	for await (const chunk of fileStream) {
	  buffer = Buffer.concat([buffer, chunk]);
	  while (buffer.length >= chunkSize) {
		// Use Uint8Array.prototype.slice
		const chunkToYield = buffer.subarray(0, chunkSize); // Use `subarray` instead of `slice`
		yield Buffer.from(chunkToYield);
		buffer = buffer.subarray(chunkSize); // Update the buffer with the remaining data
	  }
	}
  
	if (buffer.length > 0) {
	  yield buffer; // Yield any remaining data
	}
  }
  