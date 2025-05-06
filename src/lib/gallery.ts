import JSZip from 'jszip';
import { tempAttendeeSecretParam } from './enums';

export async function downloadAsZip(selectedImages: []) {
	if (selectedImages.length === 0) {
		alert('No images selected!');
		return;
	}

	const zip = new JSZip();
	const folder = zip.folder('bonfire-images');
	if (!folder) {
		console.error('Failed to create ZIP folder.');
		return;
	}

	// Add images to the ZIP
	await Promise.all(
		selectedImages.map(async ({ src, name }) => {
			try {
				const response = await fetch(src);
				if (!response.ok) {
					console.error(`Failed to fetch ${src}: ${response.statusText}`);
					return;
				}

				const blob = await response.blob();
				console.log(`Blob type: ${blob.type}, Blob size: ${blob.size} bytes`);
				if (blob.size === 0) {
					console.error(`Blob is empty for ${src}`);
					return;
				}

				folder.file(name, blob);
				console.log(`Added ${name} to folder`);
			} catch (error) {
				console.error(`Error fetching ${src}:`, error);
			}
		})
	);

	// Generate the ZIP and download
	try {
		const content = await zip.generateAsync({ type: 'blob' });
		const zipFileName = 'selected-images.zip';

		const a = document.createElement('a');
		a.href = URL.createObjectURL(content);
		a.download = zipFileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		console.log('ZIP download initiated successfully.');
	} catch (error) {
		console.error('Error generating ZIP:', error);
		alert('Failed to generate ZIP file.');
	}
}

export async function shareImages(selectedImages: []) {
	if (selectedImages.length === 0) {
		alert('No images selected!');
		return;
	}

	// Fetch and prepare files
	try {
		const files = await Promise.all(
			selectedImages.map(async ({ src, name }) => {
				const response = await fetch(src);
				if (!response.ok) {
					console.error(`Failed to fetch ${src}: ${response.statusText}`);
					return null;
				}
				const blob = await response.blob();
				console.log(`Blob type: ${blob.type}, Blob size: ${blob.size} bytes`);
				if (blob.size === 0) {
					console.error(`Blob is empty for ${src}`);
					return null;
				}
				return new File([blob], name, { type: blob.type });
			})
		);

		// Filter out any null files (failed fetches)
		const validFiles = files.filter((file) => file !== null);

		if (validFiles.length === 0) {
			alert('No valid images to share.');
			return;
		}

		// Trigger the native sharing sheet
		await navigator.share({
			title: 'Download Images',
			files: validFiles
		});
	} catch (error) {
		console.error('Sharing failed:', error);
		alert('Your device does not support sharing these images.');
	}
}



/**
	 * Fetches banner information for a given Bonfire (event) ID.
	 *
	 * @param {string} bonfireId - The ID of the bonfire (event).
	 * @param {string | null} tempAttendeeSecret - (Optional) Temporary attendee secret.
	 * @returns {Promise<BannerInfo | null>} - The banner information or null if not found.
	 */
export async function fetchBannerInfo(bonfireId: string, tempAttendeeSecret: string | null = null) {
	try {
		// Construct the URL with optional temp attendee authentication
		let url = `/bonfire/${bonfireId}/media/get-banner`;
		if (tempAttendeeSecret) {
			url += `?${tempAttendeeSecretParam}=${encodeURIComponent(tempAttendeeSecret)}`;
		}

		// Fetch the banner data
		const response = await fetch(url, {
			method: 'GET',
			credentials: 'include', // Ensure cookies and auth tokens are sent
			headers: {
				'Content-Type': 'application/json'
			}
		});

		// Handle non-OK responses (403, 404, etc.)
		if (!response.ok) {
			if (response.status === 403) {
				console.warn('User is not an attendee of this event.');
				return null;
			}
			if (response.status === 404) {
				console.warn('No banner found for this event.');
				return null;
			}
			throw new Error(`Failed to fetch banner: ${response.statusText}`);
		}
		// Parse the response JSON
		return await response.json();
	} catch (error) {
		console.error('Error fetching banner info:', error);
		return null;
	}
}