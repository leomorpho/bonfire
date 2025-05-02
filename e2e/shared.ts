import { faker } from '@faker-js/faker';
import { chromium, expect } from '@playwright/test';
import path from 'path';

export const WEBSITE_URL = 'http://localhost:5173';
export const EMAIL_CAPTURE_PORTAL_URL = 'http://localhost:8025/';

export async function loginUser(
	page,
	email: string = faker.internet.email(),
	username: string | null = faker.person.firstName(),
	isOnboarding: boolean = true,
	isFirstLogin:boolean=true
) {
	// Enter email
	await navigateTo(page, WEBSITE_URL);

	await page.getByRole('link', { name: 'login' }).click();
	await page.getByPlaceholder('Email').click();
	await page.getByPlaceholder('Email').fill(email);
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByText('Check your inbox')).toBeVisible();

	// Get code from email
	const otp = await getEmailOTP(email, isFirstLogin);

	// Wait for the `otp-root` element to be visible
	// Wait for the `otp-root` element to be visible
	const otpRoot = page.locator('#otp-entry');

	// Wait for the otpRoot to be visible
	await otpRoot.waitFor({ state: 'visible' });

	// Locate the input field within the otpRoot
	const otpInput = otpRoot.locator('input'); // Adjust the selector as needed

	// Fill the input field
	await otpInput.fill(otp);

	if (username) {
		await expect(page.getByText('Choose Your Username').first()).toBeVisible();
		await page.getByPlaceholder('Charlotte Brönte').click();
		await page.getByPlaceholder('Charlotte Brönte').type(username); // Simulates typing
		await page.getByRole('button', { name: 'Save' }).click();
	}

	if (isOnboarding) {
		// Finish onboarding
		// await page.locator('#agree-to-free-logs-btn').click();
		await page.locator('#finish-permission-onboarding-btn').click();
	}

	await page.getByRole('tab', { name: 'Upcoming' }).click();
	await expect(page.locator('#dashboard-header-menu-item')).toBeVisible();

	await expect(page.locator('#profile-header-menu-item')).toBeVisible();

	await expect(page.locator('#settings-header-menu-item')).toBeVisible();
}

export async function getEmailOTP(emailAddress: string, firstLogin = true) {
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	await navigateTo(page, EMAIL_CAPTURE_PORTAL_URL);

	const emailLink = page.locator(`a:has-text("To: ${emailAddress}")`).first();
	// Wait for the link to be visible
	await emailLink.waitFor();

	// Click the link or perform any other action
	await emailLink.click();

	const expectedTitle = firstLogin ? 'Your activation pin' : 'Your magic pin';
	const expectedText = firstLogin ? 'Here’s your activation pin' : 'Here’s your magic pin';

	await expect(
		page.locator('#preview-html').contentFrame().getByRole('heading', { name: expectedTitle })
	).toBeVisible();
	await expect(page.locator('#preview-html').contentFrame().getByText(expectedText)).toBeVisible();

	// Wait for the frame containing the email content to load
	const emailFrame = await page.locator('#preview-html').contentFrame();
	if (!emailFrame) {
		throw new Error('Email content frame not found');
	}

	// Extract the entire email content
	const emailContent = await emailFrame.locator('body').innerText();

	// Use a regular expression to find the first 6-digit string
	const otpMatch = emailContent.match(/\b\d{3}\s\d{3}\b/);
	if (!otpMatch) {
		throw new Error('OTP not found in the email content');
	}

	// Extract the OTP
	const otp = otpMatch[0].replace(/\s/g, '');

	console.log('Extracted OTP:', otp);

	// Ensure OTP is not null or empty
	expect(otp).not.toBeNull();
	expect(otp).not.toBe('');

	await page.close();
	return otp;
}

export async function createBonfire(
	page,
	eventName = `${faker.animal.dog()} birthday party!`,
	details = `Join us for ${eventName} It will be a fun evening filled with dog treats!`,
	maxGuestsPerAttendee = 0
) {
	await navigateTo(page, WEBSITE_URL);

	await page.locator('#create-bonfire-button').click();

	await expect(page.getByRole('heading', { name: 'General info' })).toBeVisible();
	await expect(page.getByPlaceholder('Event Name')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Pick a date' })).toBeVisible();
	await expect(page.getByPlaceholder('HH')).toBeVisible();
	await expect(page.getByPlaceholder('mm')).toBeVisible();
	await expect(page.getByRole('button', { name: 'PM caret sort' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'to' }).first()).toBeVisible();
	await expect(page.getByText('Enter event address...')).toBeVisible();
	await expect(page.locator('#event-styles-tab')).toBeVisible();

	// Enter info and date
	await page.getByPlaceholder('Event Name').click();
	await page.getByPlaceholder('Event Name').fill(eventName);
	await page.getByRole('button', { name: 'Pick a date' }).click();
	await page.getByLabel('Next').click();
	await page.click('[data-bits-calendar-cell][data-value$="-01"]:not([data-outside-month])');

	// Enter start time
	await page.getByPlaceholder('HH').click();
	await page.getByPlaceholder('HH').fill('6');

	// Enter details
	await enterDetailsIntoEditor(page, details);

	// Enter address
	await page.getByText('Enter event address...').click();
	await page.getByPlaceholder('1600 Pennsylvania Avenue,').fill('15 rue du luxembourg, mouscron');
	await page.getByText('Rue du Luxembourg 15, 7700').click();

	if (maxGuestsPerAttendee == 0) {
		await page.getByRole('checkbox', { name: 'Let attendees bring guests' }).click();
	} else {
		await page.locator('#maxNumberOfGuestsPerAttendeeInput').click();
		await page.locator('#maxNumberOfGuestsPerAttendeeInput').fill('05');
	}

	await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled();
	await page.waitForTimeout(2000);
	await page.getByRole('button', { name: 'Publish' }).click();

	await expect(page.locator('#event-title')).toBeVisible();
}

export async function rsvpAsLoggedInUser(page, eventUrl) {
	try {
		const email = faker.internet.email();
		const username = faker.person.firstName();

		// Log in the user
		await loginUser(page, email, username);

		// Navigate to the event
		await navigateTo(page, eventUrl);

		// Set RSVP status
		await page.getByText('RSVP', { exact: true }).click();
		await page.getByRole('menuitem', { name: 'Going', exact: true }).click();

		console.log(`################# User ${username} RSVPed as "Going" on the event at ${eventUrl}`);
	} finally {
		await page.close();
	}
}

export async function rsvpAsTempUser(page, eventUrl) {
	try {
		const tempUsername = faker.person.firstName();

		// Navigate to the event
		await navigateTo(page, eventUrl);

		// Set RSVP status
		await page.getByText('RSVP', { exact: true }).click();
		await page.getByRole('menuitem', { name: 'Going', exact: true }).click();

		// Generate a unique URL for the temporary user
		await page.getByPlaceholder('Tony Garfunkel').click();
		await page.getByPlaceholder('Tony Garfunkel').fill(tempUsername);
		await page.getByRole('button', { name: 'Generate URL' }).click();

		console.log(
			`############### Temporary user ${tempUsername} RSVPed as "Going" on the event at ${eventUrl}`
		);
	} finally {
		await page.close();
	}
}

export async function addAnnouncementAsEventCreator(page, eventUrl) {
	// Navigate to the event
	await navigateTo(page, eventUrl);

	// Click the button to create a new announcement
	await page.getByRole('button', { name: 'New announcement' }).click();

	// Fill out the announcement details
	const announcementText = faker.lorem.sentence();
	await page.getByPlaceholder('Type your announcement here').click();
	await page.getByPlaceholder('Type your announcement here').fill(announcementText);

	// Submit the announcement
	await page.getByRole('button', { name: 'Create' }).click();

	console.log(`Added announcement: "${announcementText}" to the event at ${eventUrl}`);
}

export async function uploadGalleryImage(page, eventUrl, expectedTotalImageCount = 1) {
	// Navigate to the event
	await navigateTo(page, eventUrl);

	// Click the button to add to the gallery
	await page.getByRole('button', { name: 'Upload' }).click();

	// Select an image to upload
	const fileInput = await page.locator('input[type="file"]').first();
	const imagePath = path.resolve(process.cwd(), 'e2e/test-images', 'gallery-image.jpg');
	await fileInput.setInputFiles(imagePath);
	await page.getByLabel('Upload 1 file').click();
	await expect(page.locator('.gallery-item')).toHaveCount(expectedTotalImageCount, {
		timeout: 20000
	});
	console.log(`Uploaded a gallery image to the event at ${eventUrl}`);
}

export async function navigateTo(page, URL) {
	await page.goto(URL, { waitUntil: 'load' });
}

export async function enterDetailsIntoEditor(page, details) {
	try {
		// Wait for the contenteditable div to be present in the DOM
		await page.waitForSelector('#details-editor [contenteditable="true"]', { state: 'visible' });

		// Focus the contenteditable div
		await page.focus('#details-editor [contenteditable="true"]');

		// Split the details into smaller chunks and type them
		const chunkSize = 50; // Adjust the chunk size as needed
		for (let i = 0; i < details.length; i += chunkSize) {
			const chunk = details.substring(i, i + chunkSize);
			await page.type('#details-editor [contenteditable="true"]', chunk);
		}

		console.log('Details entered successfully.');
	} catch (error) {
		console.error('Error entering details:', error);
	}
}
