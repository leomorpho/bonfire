import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';
import { Readable } from 'stream';

// Create an S3 client
const s3 = new S3Client({
	region: 'us-west-002', // Your Backblaze region
	endpoint: env.S3_ENDPOINT,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY
	}
});

export async function uploadProfileImageToS3(file: File, userId: string) {
	const key = `profile-image/${userId}`;

	try {
		// Convert the File to a Buffer
		const buffer = Buffer.from(await file.arrayBuffer());

		// Create a Node.js readable stream
		const stream = Readable.from(buffer);

		const command = new PutObjectCommand({
			Bucket: 'bucketName', // Replace with your bucket name
			Key: key,
			Body: stream,
			ContentType: file.type,
			ACL: 'private', // Ensure the file is private
		});

		const response = await s3.send(command);
		console.log('Upload successful:', response);

		// Return the file key for later use
		return key;
	} catch (error) {
		console.error('Error uploading image:', error);
		throw error;
	}
}

export async function generateSignedUrl(bucketName: string, key: string, expiresIn = 3600) {
	try {
		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: key
		});

		const signedUrl = await getSignedUrl(s3, command, { expiresIn });
		console.log('Signed URL:', signedUrl);
		return signedUrl;
	} catch (error) {
		console.error('Error generating signed URL:', error);
		throw error;
	}
}
