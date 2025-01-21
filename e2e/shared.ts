import { faker } from '@faker-js/faker';
import { chromium, expect } from '@playwright/test';

export const WEBSITE_URL = 'http://localhost:5173';
export const EMAIL_CAPTURE_PORTAL_URL = 'http://localhost:8025/';

export async function loginUser(
	page,
	email = faker.internet.email(),
	username = faker.person.firstName()
) {
	// Enter email
	await page.goto(`${WEBSITE_URL}/`);
	await page.getByRole('link', { name: 'login' }).click();
	await page.getByPlaceholder('Email').click();
	await page.getByPlaceholder('Email').fill(email);
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByText('Check your inbox')).toBeVisible();

	// Get code from email
	const otp = await getEmailOTP(email);

	// Wait for the `otp-root` element to be visible
	const otpRoot = page.locator('#otp-entry');
	await otpRoot.waitFor({ state: 'visible' });

	// Locate the input field inside the `otp-root` element
	const otpInput = otpRoot.locator('input[name="otp"]');

	// Ensure the input field is visible
	await otpInput.waitFor({ state: 'visible' });

	// Type the OTP into the input field
	await otpInput.fill(otp);

	await expect(page.getByText('Choose Your Username').first()).toBeVisible();
	await page.getByPlaceholder('Charlotte Brönte').click();
	await page.getByPlaceholder('Charlotte Brönte').type(username); // Simulates typing
	await page.getByRole('button', { name: 'Save' }).click();

	await expect(page.getByRole('heading', { name: 'Upcoming Bonfires' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
}

export async function getEmailOTP(emailAddress: string) {
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	page.goto(EMAIL_CAPTURE_PORTAL_URL);

	const emailLink = page.locator(`a:has-text("To: ${emailAddress}")`);
	// Wait for the link to be visible
	await emailLink.waitFor();

	// Click the link or perform any other action
	await emailLink.first().click();

	await expect(
		page
			.locator('#preview-html')
			.contentFrame()
			.getByRole('heading', { name: 'Your activation link' })
	).toBeVisible();
	await expect(
		page.locator('#preview-html').contentFrame().getByText('Here’s your activation pin')
	).toBeVisible();

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

	return otp;
}

export async function createBonfire(page, eventName = `${faker.animal.dog()}'s birthday party!`) {
	await page.goto(WEBSITE_URL);
	await page.locator('#create-bonfire-button').click();

	const details = `Join us for ${eventName} It will be a fun evening filled with dog treats!`;

	await expect(page.getByRole('heading', { name: 'Create a Bonfire' })).toBeVisible();
	await expect(page.getByPlaceholder('Event Name')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Pick a date' })).toBeVisible();
	await expect(page.getByPlaceholder('HH')).toBeVisible();
	await expect(page.getByPlaceholder('mm')).toBeVisible();
	await expect(page.getByRole('button', { name: 'PM caret sort' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'to' })).toBeVisible();
	await expect(page.getByText('Enter event address...')).toBeVisible();
	await expect(page.getByPlaceholder('Details')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Edit event style' })).toBeVisible();
	await expect(page.getByText('Cancel Edit event style Create')).toBeVisible();

	// Enter date
	await page.getByPlaceholder('Event Name').click();
	await page.getByPlaceholder('Event Name').fill(eventName);
	await page.getByRole('button', { name: 'Pick a date' }).click();
	await page.getByLabel('Next').click();
	await page.click('[data-bits-calendar-cell][data-value$="-01"]:not([data-outside-month])');

	// Enter start time
	await page.getByPlaceholder('HH').click();
	await page.getByPlaceholder('HH').fill('6');

	// Enter details
	await page.getByPlaceholder('Details').click();
	await page.getByPlaceholder('Details').fill(details);

	// Enter address
	await page.getByText('Enter event address...').click();
	await page.getByPlaceholder('1600 Pennsylvania Avenue,').fill('15 rue du luxembourg, mouscron');
	await page.getByText('Rue du Luxembourg 15, 7700').click();

	await page.getByRole('button', { name: 'Create' }).click();

	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();
}
