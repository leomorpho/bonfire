import { test, expect } from '@playwright/test';
import { loginUser, WEBSITE_URL } from './shared';
import { faker } from '@faker-js/faker';

test('New login', async ({ page }) => {
	await page.goto(WEBSITE_URL);

	await expect(page.getByRole('banner').getByRole('link', { name: 'About' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
	await page.getByRole('link', { name: 'FAQ' }).click();
	await expect(page.getByRole('link', { name: 'FAQ' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'login' })).toBeVisible();
	await page.getByRole('link', { name: 'login' }).click();
	await expect(page.getByPlaceholder('Email')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();

	await loginUser(page);

	await expect(page.getByRole('heading', { name: 'Upcoming Bonfires' })).toBeVisible();
});

test('Create bonfire', async ({ page }) => {
	await page.goto(WEBSITE_URL);

	await loginUser(page);

	await page.locator('#create-bonfire-button').click();

	const eventName = `${faker.animal.dog()}'s birthday party!`;
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

	// Check that create button is disabled
	await expect(page.locator('#upsert-bonfire')).toBeDisabled();

	// Enter date
	await page.getByPlaceholder('Event Name').click();
	await page.getByPlaceholder('Event Name').fill(eventName);

	// Check that create button is disabled
	await expect(page.locator('#upsert-bonfire')).toBeDisabled();

	await page.getByRole('button', { name: 'Pick a date' }).click();
	await page.getByLabel('Next').click();
	await page.click('[data-bits-calendar-cell][data-value$="-01"]:not([data-outside-month])');

	// Check that create button is disabled
	await expect(page.locator('#upsert-bonfire')).toBeDisabled();

	// Enter start time
	await page.getByPlaceholder('HH').click();
	await page.getByPlaceholder('HH').fill('6');

	// Check that create button is enabled
	await expect(page.locator('#upsert-bonfire')).toBeEnabled();

	// Enter details
	await page.getByPlaceholder('Details').click();
	await page.getByPlaceholder('Details').fill(details);

	// Enter address
	await page.getByText('Enter event address...').click();
	await page.getByPlaceholder('1600 Pennsylvania Avenue,').fill('15 rue du luxembourg, mouscron');
	await page.getByText('Rue du Luxembourg 15, 7700').click();

	await page.getByRole('button', { name: 'Create' }).click();

	// Event was created
	// Check event name
	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();

	// Verify address shows in mapping app dialog
	await page.locator('#share-location').click();
	await expect(page.getByRole('heading', { name: 'Open in mapping app' })).toBeVisible();
	await expect(page.locator('#google-maps-icon')).toBeVisible();
	await expect(page.locator('#apple-icon')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Waze' })).toBeVisible();
	await expect(page.locator('#bing-icon')).toBeVisible();
	await page.getByRole('button', { name: 'cross 2 Close' }).click();

	// Check event details
	await expect(page.getByText(details)).toBeVisible();

	// Check general stuff
	await expect(page.getByText('No attendees yet')).toBeVisible();
	await expect(page.getByText('RSVP')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Share Bonfire' })).toBeVisible();
	await expect(page.getByText('Announcements', { exact: true })).toBeVisible();
	await expect(page.getByText('No announcements yet')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Create new announcement' })).toBeVisible();
	await expect(page.getByText('Gallery', { exact: true })).toBeVisible();
	await expect(page.getByText('No photos/videos yet')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Add to gallery' })).toBeVisible();
});
