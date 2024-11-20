import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';
import sharp from 'sharp'; // For resizing images
import { serverTriplitClient } from './triplit';

// Create an S3 client
const s3 = new S3Client({
	region: env.S3_REGION, // Your Backblaze region
	endpoint: env.S3_ENDPOINT,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY
	}
});

export async function uploadProfileImageToS3(file: File, userId: string) {
	const bucketName = 'bonfire2'; // TODO: change

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
