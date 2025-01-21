import { test, expect } from '@playwright/test';
import { loginUser, WEBSITE_URL } from './shared';
import { faker } from '@faker-js/faker';
import path from 'path';

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

	const email = faker.internet.email();
	const username = faker.person.firstName();

	await loginUser(page, email, username);

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

	// ------> Event was created
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

	await expect(page.getByText('Hosted by')).toBeVisible();

	// Check event details
	await expect(page.getByText(details)).toBeVisible();

	await expect(page.getByText('No attendees yet')).toBeVisible();

	// Set RSVP state
	await expect(page.getByText('RSVP')).toBeVisible();
	await page.getByText('RSVP').click();
	await page.getByRole('menuitem', { name: 'Going', exact: true }).click();
	await expect(page.locator('#rsvp-button')).toHaveText('Going');

	// Verify that there is exactly one user attending
	await expect(page.locator('#going-attendees').locator('.profile-avatar')).toHaveCount(1);
	// Now set as "not going"
	await page.getByText('Going').click();
	await page.getByRole('menuitem', { name: 'Not going', exact: true }).click();
	await expect(page.locator('#rsvp-button')).toHaveText('Not going');
	await expect(page.locator('#going-attendees').locator('.profile-avatar')).toHaveCount(0);
	// And set back to "going"
	await page.getByText('Not going').click();
	await page.getByRole('menuitem', { name: 'Going', exact: true }).click();
	await expect(page.locator('#rsvp-button')).toHaveText('Going');
	await expect(page.locator('#going-attendees').locator('.profile-avatar')).toHaveCount(1);

	// Click on share button
	await expect(page.getByRole('button', { name: 'Share Bonfire' })).toBeVisible();
	await page.getByRole('button', { name: 'Share Bonfire' }).click();
	// TODO: below not working, not sure why as sonner shows in UI
	// await expect(page.getByText('Invitation copied to')).toBeVisible();

	// Check general stuff
	await expect(page.getByText('Announcements', { exact: true })).toBeVisible();
	await expect(page.getByText('No announcements yet')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Create new announcement' })).toBeVisible();
	await expect(page.getByText('Gallery', { exact: true })).toBeVisible();
	await expect(page.getByText('No photos/videos yet')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Add to gallery' })).toBeVisible();

	// Upload a banner image
	const imagePath = path.resolve(process.cwd(), 'e2e/test-images', 'banner.jpeg');

	await page.getByRole('button', { name: 'Set a banner image' }).click();
	await expect(page.getByRole('heading', { name: 'Set Banner' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'My Device' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'Camera' })).toBeVisible();
	await expect(page.getByText('Image only. Max size: 5MB.')).toBeVisible();

	const fileInput = await page.locator('input[type="file"]').first();
	await fileInput.setInputFiles(imagePath);
	await page.getByRole('button', { name: 'Save', exact: true }).click();
	await page.getByLabel('Upload 1 file').click();

	await expect(page.getByRole('img', { name: 'Banner for large screens' })).toBeVisible();
	await expect(page.getByLabel('Upload a new banner')).toBeVisible();

	// Go to edit page and set background
	await page.locator('#edit-bonfire').getByRole('button').click();
	await page.getByRole('button', { name: 'Edit event style' }).click();
	await page.getByRole('button', { name: 'Optical Illusion Pattern', exact: true }).click();
	await page.getByText('Edit overlay').click();
	await expect(page.getByText('Overlay', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
	await page.getByRole('button', { name: 'chevron left Back' }).click();
	await page.getByRole('button', { name: 'Update' }).click();

	// Verify address as it used to be mangled (possible bug again) when coming back from edit page
	await page.locator('#share-location').click();
	await expect(page.getByRole('heading', { name: 'Open in mapping app' })).toBeVisible();
	await expect(page.locator('#google-maps-icon')).toBeVisible();
	await expect(page.locator('#apple-icon')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Waze' })).toBeVisible();
	await expect(page.locator('#bing-icon')).toBeVisible();
	await page.getByRole('button', { name: 'cross 2 Close' }).click();

	await page.locator('#going-attendees').locator('.profile-avatar').click();
	await expect(page.getByRole('heading', { name: username })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Remove user from event' })).toBeVisible();
	await page.getByRole('button', { name: 'Remove user from event' }).click();
	await expect(page.getByRole('heading', { name: 'Are you absolutely sure?' })).toBeVisible();
	await expect(page.getByText('This action cannot be undone')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Yes, remove' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
	await page.getByRole('button', { name: 'cross 2 Close' }).click();
});
