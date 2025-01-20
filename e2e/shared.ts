import { faker } from '@faker-js/faker';
import { chromium, expect } from '@playwright/test';

export const WEBSITE_URL = 'http://localhost:5173';
export const EMAIL_CAPTURE_PORTAL_URL = 'http://localhost:8025/';

export async function loginUser(page) {
	const email = faker.internet.email();
	const username = faker.person.firstName();

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
