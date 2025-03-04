import { test, expect } from '@playwright/test';
import {
	addAnnouncementAsEventCreator,
	createBonfire,
	loginUser,
	navigateTo,
	uploadGalleryImage,
	WEBSITE_URL
} from './shared';
import { faker } from '@faker-js/faker';
import path from 'path';
import { TriplitClient } from '@triplit/client';
import { schema } from '../triplit/schema';
import dotenv from 'dotenv';

dotenv.config(); // Load env variables from .env

test.beforeEach(async ({ page }) => {
	await page.context().clearCookies();
	await page.context().clearPermissions();
});

const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: process.env.PUBLIC_TRIPLIT_URL,
	token: process.env.TRIPLIT_SERVICE_TOKEN
});

test('New login', async ({ page }) => {
	await navigateTo(page, WEBSITE_URL);

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
	await navigateTo(page, WEBSITE_URL);

	const email = faker.internet.email();
	const username = faker.person.firstName();

	await loginUser(page, email, username);

	await page.locator('#create-bonfire-button').click();

	const eventName = `${faker.animal.dog()} birthday party!`;
	const details = `Join us for ${eventName} It will be a fun evening filled with dog treats!`;

	await expect(page.getByRole('heading', { name: 'Create a Bonfire' })).toBeVisible();
	await expect(page.getByPlaceholder('Event Name')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Pick a date' })).toBeVisible();
	await expect(page.getByPlaceholder('HH')).toBeVisible();
	await expect(page.getByPlaceholder('mm')).toBeVisible();
	await expect(page.getByRole('button', { name: 'PM caret sort' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'to' }).first()).toBeVisible();
	await expect(page.getByText('Enter event address...')).toBeVisible();
	await expect(page.getByPlaceholder('Details')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Edit event style' })).toBeVisible();

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

	await expect(page.getByRole('button', { name: 'Save Draft' })).toBeEnabled();
	await page.waitForTimeout(500);
	await page.getByRole('button', { name: 'Save Draft' }).click({ force: true });

	// Check that event is marked as temporary on bonfire view
	await expect(page.getByText('Not Published')).toBeVisible();
	await page.getByRole('link', { name: 'Logo' }).click();

	// Check that event is marked as temporary on dashboard view
	await expect(page.getByText('Not Published')).toBeVisible();
	await page.locator('.event-card').first().click();

	// Return to edit page
	await page.locator('#edit-bonfire').getByRole('button').click();

	await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled();
	await page.waitForTimeout(100);
	await page.getByRole('button', { name: 'Publish' }).click({ force: true });
	await expect(page.getByText('Not Published')).toBeHidden();

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

	await expect(page.locator('#going-attendees').locator('.profile-avatar')).toHaveCount(1);

	// Set RSVP state
	await expect(page.getByText('Going').first()).toBeVisible();

	// Verify that there is exactly one user attending
	await expect(page.locator('#going-attendees').locator('.profile-avatar')).toHaveCount(1);
	// Now set as "not going"

	await page.locator('#rsvp-btn').click();
	await page.getByRole('menuitem', { name: 'Not going' }).click();

	await expect(page.locator('#rsvp-button')).toHaveText('Not going');

	await expect(page.locator('#going-attendees').locator('.profile-avatar')).toHaveCount(0);
	// And set back to "going"
	await page.getByText('Not going').last().click();
	await page.getByRole('menuitem', { name: 'Going', exact: true }).click();
	await expect(page.locator('#rsvp-button').first()).toHaveText('Going');
	await expect(page.locator('#going-attendees').locator('.profile-avatar')).toHaveCount(1);

	await page.locator('#add-to-calendar').click();
	await expect(page.getByRole('menuitem', { name: 'Google Calendar' })).toBeVisible();
	await expect(page.getByRole('menuitem', { name: 'Outlook Calendar' })).toBeVisible();
	await expect(page.getByRole('menuitem', { name: 'Apple Calendar (.ics)' })).toBeVisible();

	// Click on share button
	await expect(page.getByRole('button', { name: 'Share Bonfire' })).toBeVisible();
	await page.getByRole('button', { name: 'Share Bonfire' }).click({ force: true });
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
	await page.getByRole('button', { name: 'Publish' }).click();

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

test('CRUD announcements', async ({ page }) => {
	// await navigateTo(page, WEBSITE_URL);

	const email = faker.internet.email();
	const username = faker.person.firstName();
	await loginUser(page, email, username);

	const eventName = `${faker.animal.dog()} birthday party!`;
	await createBonfire(page, eventName);
	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();

	// Create
	await expect(page.getByText('No announcements yet')).toBeVisible();
	await page.getByRole('button', { name: 'Create new announcement' }).click();
	await expect(page.getByRole('heading', { name: 'Create Announcement' })).toBeVisible();
	await page.getByPlaceholder('Type your announcement here').click();
	await page.getByPlaceholder('Type your announcement here').fill('An announcement!');
	await page.getByRole('button', { name: 'Create Announcement' }).click();
	// Check we are back on bonfire view
	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'An announcement!' })).toBeVisible();
	await expect(page.locator('.announcement')).toHaveCount(1);

	// Update
	await page.locator('.update-announcement').first().click();

	await page.getByPlaceholder('Type your announcement here').click();
	await page.getByPlaceholder('Type your announcement here').press('ControlOrMeta+a');
	await page.getByPlaceholder('Type your announcement here').fill('Updated announcement');
	await expect(page.getByRole('button', { name: 'Update Announcement' })).toBeVisible();
	await page.getByRole('button', { name: 'Update Announcement' }).click();
	// Check we are back on bonfire view
	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Updated announcement' })).toBeVisible();
	await expect(page.locator('.announcement')).toHaveCount(1);

	// Delete
	await page.locator('.update-announcement').first().click();

	await page.getByText('Delete Announcement').click();
	await expect(page.getByRole('heading', { name: 'Are you sure?' })).toBeVisible();
	await expect(page.getByText('This action cannot be undone')).toBeVisible();
	await page.getByRole('button', { name: 'Confirm Delete' }).click();
	// Check we are back on bonfire view
	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();
	await expect(page.locator('.announcement')).toHaveCount(0);
});

test('CRUD gallery', async ({ page }) => {
	// await navigateTo(page, WEBSITE_URL);

	const email = faker.internet.email();
	const username = faker.person.firstName();
	await loginUser(page, email, username);

	const eventName = `${faker.animal.dog()} birthday party!`;
	await createBonfire(page, eventName);
	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();

	await page.getByRole('button', { name: 'Add to gallery' }).click();

	const fileInput = await page.locator('input[type="file"]').first();
	const imagePath = path.resolve(process.cwd(), 'e2e/test-images', 'gallery-image.jpg');
	await fileInput.setInputFiles(imagePath);
	await page.getByLabel('Upload 1 file').click();
	await expect(page.locator('.gallery-item')).toHaveCount(1);

	// TODO: difficulty with playwright closing the image
	// // // Test open/close of lightroom
	// await page.locator('.gallery-item').first().click();
	// await page.keyboard.press('Escape');

	// // Open in light room
	// await page.locator('.gallery-item').first().click();
	// await expect(page.locator('.download-button').first()).toBeVisible();
	// await expect(page.locator('.delete-button').first()).toBeVisible();

	// // Try deleting image from lightroom, then cancel
	// await page.locator('.delete-button').first().click();
	// await page.getByRole('dialog').getByRole('button').nth(1).click();
	// await expect(page.getByRole('heading', { name: 'Are you absolutely sure?' })).toBeVisible();
	// await page.getByRole('button', { name: 'Cancel' }).click();
	// await page.keyboard.press('Escape');

	// Check top bar buttons
	await expect(page.locator('#upload-new-images')).toBeVisible();
	await expect(page.locator('#toggle-select-images')).toBeVisible();
	await expect(page.locator('#toggle-show-user-uploaded-images')).toBeVisible();

	// Toggle "show mine" back and forth
	await page.locator('#toggle-show-user-uploaded-images').click();
	await expect(page.locator('.gallery-item')).toHaveCount(1);
	await page.locator('#toggle-show-user-uploaded-images').click();
	await expect(page.locator('.gallery-item')).toHaveCount(1);

	// Test "select" toggle
	await page.locator('#toggle-select-images').click();
	await page.getByRole('button', { name: 'Select All' }).click();
	await page.getByRole('button', { name: 'Select None' }).click();
	await page.getByRole('button', { name: 'Select All' }).click();

	await page.locator('#delete-selected-files').click();
	await expect(page.getByRole('heading', { name: 'Are you absolutely sure?' })).toBeVisible();
	await expect(page.getByText('This action cannot be undone')).toBeVisible();
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.locator('.gallery-item')).toHaveCount(0);
});

test('User attendee view', async ({ browser }) => {
	const context1 = await browser.newContext();
	const context2 = await browser.newContext();
	const eventCreatorPage = await context1.newPage();
	const userAttendeePage = await context2.newPage();

	// Create event from creator POV
	const email = faker.internet.email();
	const username = faker.person.firstName();
	await loginUser(eventCreatorPage, email, username);

	const eventName = `${faker.animal.dog()} birthday party!`;
	const eventDetails = 'It will be fun!';
	await createBonfire(eventCreatorPage, eventName, eventDetails);
	await expect(eventCreatorPage.getByRole('heading', { name: eventName })).toBeVisible();

	const eventUrl = eventCreatorPage.url();

	// TODO: there's some fucking black magic and the attendees are NOT getting created
	// const context3 = await browser.newContext();
	// const context4 = await browser.newContext();
	// const page3 = await context3.newPage();
	// const page4 = await context4.newPage();

	// // Add logged in users and temp users as attendees, making sure we see the correct things
	// await rsvpAsLoggedInUser(page3, eventUrl);
	// await rsvpAsTempUser(page4, eventUrl);

	// Have creator add announcements and files to make sure others can only see count until RSVP is set.
	await addAnnouncementAsEventCreator(eventCreatorPage, eventUrl);
	await uploadGalleryImage(eventCreatorPage, eventUrl);
	await eventCreatorPage.close();

	// Temp attendee
	const userEmail = faker.internet.email();
	const userUsername = faker.person.firstName();
	await navigateTo(userAttendeePage, eventUrl);
	await loginUser(userAttendeePage, userEmail, userUsername);
	await navigateTo(userAttendeePage, eventUrl);

	// Temp user should not be able to set a banner
	await expect(userAttendeePage.getByRole('heading', { name: 'Set Banner' })).toHaveCount(0);
	await expect(userAttendeePage.getByRole('heading', { name: eventName })).toBeVisible();
	await expect(userAttendeePage.getByText(`Hosted by ${username}`)).toBeVisible();
	await expect(userAttendeePage.getByText(eventDetails)).toBeVisible();
	await expect(userAttendeePage.getByText('Set RSVP status to see location')).toBeVisible();

	await expect(userAttendeePage.getByText(eventDetails)).toBeVisible();
	await expect(userAttendeePage.getByText('1 going')).toBeVisible();
	await expect(userAttendeePage.getByText('1 announcement(s)')).toBeVisible();
	await expect(userAttendeePage.getByText('1 file(s)')).toBeVisible();

	await userAttendeePage.getByText('RSVP', { exact: true }).click();
	await userAttendeePage.getByRole('menuitem', { name: 'Going', exact: true }).click();
});

test('Temp attendee view', async ({ browser }) => {
	const context1 = await browser.newContext();
	const context2 = await browser.newContext();
	const eventCreatorPage = await context1.newPage();
	const tempAttendeePage = await context2.newPage();

	// Create event from creator POV
	const email = faker.internet.email();
	const username = faker.person.firstName();
	await loginUser(eventCreatorPage, email, username);

	const eventName = `${faker.animal.dog()} birthday party!`;
	const eventDetails = 'It will be fun!';
	await createBonfire(eventCreatorPage, eventName, eventDetails);
	await expect(eventCreatorPage.getByRole('heading', { name: eventName })).toBeVisible();

	const eventUrl = eventCreatorPage.url();

	// TODO: there's some fucking black magic and the attendees are NOT getting created
	// const context3 = await browser.newContext();
	// const context4 = await browser.newContext();
	// const page3 = await context3.newPage();
	// const page4 = await context4.newPage();

	// // Add logged in users and temp users as attendees, making sure we see the correct things
	// await rsvpAsLoggedInUser(page3, eventUrl);
	// await rsvpAsTempUser(page4, eventUrl);

	// Have creator add announcements and files to make sure others can only see count until RSVP is set.
	await addAnnouncementAsEventCreator(eventCreatorPage, eventUrl);
	await uploadGalleryImage(eventCreatorPage, eventUrl);
	await eventCreatorPage.close();

	// Temp attendee
	const tempAttendeeUsername = faker.person.firstName();
	await navigateTo(tempAttendeePage, eventUrl);

	// Temp user should not be able to set a banner
	await expect(tempAttendeePage.getByRole('heading', { name: 'Set Banner' })).toHaveCount(0);
	await expect(tempAttendeePage.getByRole('heading', { name: eventName })).toBeVisible();
	await expect(tempAttendeePage.getByText(`Hosted by ${username}`)).toBeVisible();
	await expect(tempAttendeePage.getByText('Set RSVP status to see location')).toBeVisible();
	await expect(tempAttendeePage.getByText(eventDetails)).toBeVisible();
	await expect(tempAttendeePage.getByText('1 going')).toBeVisible();
	await expect(tempAttendeePage.getByText('1 announcement(s)')).toBeVisible();
	await expect(tempAttendeePage.getByText('1 file(s)')).toBeVisible();

	// Set RSVP status
	await tempAttendeePage.getByText('RSVP', { exact: true }).click();
	await tempAttendeePage.getByRole('menuitem', { name: 'Going', exact: true }).click();
	await expect(tempAttendeePage.getByRole('heading', { name: 'Hey There!' })).toBeVisible();
	await expect(tempAttendeePage.getByText('There are two ways to set')).toBeVisible();
	await expect(tempAttendeePage.getByRole('button', { name: 'Register/Login' })).toBeVisible();
	await expect(tempAttendeePage.locator('div').filter({ hasText: 'or' }).nth(1)).toBeVisible();
	await expect(tempAttendeePage.getByText('Generate unique URL')).toBeVisible();
	await expect(tempAttendeePage.getByText('A unique URL that connects')).toBeVisible();
	await tempAttendeePage.getByPlaceholder('Tony Garfunkel').click();
	await tempAttendeePage.getByPlaceholder('Tony Garfunkel').fill(tempAttendeeUsername);
	await tempAttendeePage.getByRole('button', { name: 'Generate URL' }).click();

	// Should be redirected to bonfire page
	await expect(
		tempAttendeePage.getByText(`Hi ${tempAttendeeUsername}! This is a temporary`)
	).toBeVisible();
	await expect(tempAttendeePage.getByText('Keep this tab open for')).toBeVisible();
	await expect(tempAttendeePage.getByText('This URL grants access to the')).toBeVisible();
	await expect(tempAttendeePage.getByText('Sign up anytime to link your')).toBeVisible();
	await expect(tempAttendeePage.getByRole('button', { name: 'Sign Up or Log In' })).toBeVisible();
	await expect(tempAttendeePage.getByRole('button', { name: 'Copy Link' })).toBeVisible();

	// Verify address shows in mapping app dialog
	await tempAttendeePage.locator('#share-location').click();
	await expect(
		tempAttendeePage.getByRole('heading', { name: 'Open in mapping app' })
	).toBeVisible();
	await expect(tempAttendeePage.locator('#google-maps-icon')).toBeVisible();
	await expect(tempAttendeePage.locator('#apple-icon')).toBeVisible();
	await expect(tempAttendeePage.getByRole('link', { name: 'Waze' })).toBeVisible();
	await expect(tempAttendeePage.locator('#bing-icon')).toBeVisible();
	await tempAttendeePage.getByRole('button', { name: 'cross 2 Close' }).click();

	await tempAttendeePage.locator('#add-to-calendar').click();
	await expect(tempAttendeePage.getByRole('menuitem', { name: 'Google Calendar' })).toBeVisible();
	await expect(tempAttendeePage.getByRole('menuitem', { name: 'Outlook Calendar' })).toBeVisible();
	await expect(
		tempAttendeePage.getByRole('menuitem', { name: 'Apple Calendar (.ics)' })
	).toBeVisible();
	await tempAttendeePage.keyboard.press('Escape'); // Close dropdown

	// Upload image to gallery
	await uploadGalleryImage(tempAttendeePage, eventUrl, 2);

	// Wait for the upload to be confirmed (adjust selector based on your UI)
	// await tempAttendeePage.waitForSelector('.upload-complete-message', { timeout: 15000 });
	await expect(tempAttendeePage.locator('.gallery-item')).toHaveCount(2, { timeout: 20000 });

	// Check top bar buttons
	await expect(tempAttendeePage.locator('#upload-new-images')).toBeVisible();
	// NOTE: the below 2 are actually shown, just greyed out and disabled. We actually show "other" elements, which
	// is something we should clean up in code to avoid duplication.
	await expect(tempAttendeePage.locator('#toggle-select-images')).toHaveCount(0);
	await expect(tempAttendeePage.locator('#toggle-show-user-uploaded-images')).toHaveCount(0);

	await tempAttendeePage.locator('.gallery-item').first().click();

	await tempAttendeePage.getByRole('dialog').getByRole('button').nth(1).click();
	await expect(
		tempAttendeePage.getByRole('heading', { name: 'Are you absolutely sure?' })
	).toBeVisible();
	await expect(tempAttendeePage.getByText('This action cannot be undone')).toBeVisible();
	await tempAttendeePage.getByRole('button', { name: 'Continue' }).click();
	await expect(tempAttendeePage.locator('.gallery-item')).toHaveCount(1);
});

test('Temp -> normal attendee transformation', async ({ browser }) => {
	const context1 = await browser.newContext();
	const context2 = await browser.newContext();
	const eventCreatorPage = await context1.newPage();
	const tempAttendeePage = await context2.newPage();

	// await navigateTo(eventCreatorPage, WEBSITE_URL);

	// Create event from creator POV
	const email = faker.internet.email();
	const username = faker.person.firstName();
	await loginUser(eventCreatorPage, email, username);

	const eventName = `${faker.animal.dog()} birthday party!`;
	const eventDetails = 'It will be fun!';
	await createBonfire(eventCreatorPage, eventName, eventDetails);
	await expect(eventCreatorPage.getByRole('heading', { name: eventName })).toBeVisible();

	const eventUrl = eventCreatorPage.url();

	// Temp attendee
	const tempAttendeeUsername = faker.person.firstName();
	await navigateTo(tempAttendeePage, eventUrl);

	// Set RSVP status
	await tempAttendeePage.getByText('RSVP', { exact: true }).click();
	await tempAttendeePage.getByRole('menuitem', { name: 'Going', exact: true }).click();
	await expect(tempAttendeePage.getByRole('heading', { name: 'Hey There!' })).toBeVisible();
	await expect(tempAttendeePage.getByText('There are two ways to set')).toBeVisible();
	await expect(tempAttendeePage.getByRole('button', { name: 'Register/Login' })).toBeVisible();
	await expect(tempAttendeePage.locator('div').filter({ hasText: 'or' }).nth(1)).toBeVisible();
	await expect(tempAttendeePage.getByText('Generate unique URL')).toBeVisible();
	await expect(tempAttendeePage.getByText('A unique URL that connects')).toBeVisible();
	await tempAttendeePage.getByPlaceholder('Tony Garfunkel').click();
	await tempAttendeePage.getByPlaceholder('Tony Garfunkel').fill(tempAttendeeUsername);
	await tempAttendeePage.getByRole('button', { name: 'Generate URL' }).click();

	// Should be redirected to bonfire page
	await expect(
		tempAttendeePage.getByText(`Hi ${tempAttendeeUsername}! This is a temporary`)
	).toBeVisible();

	const attendeeEmail = faker.internet.email();
	const attendeeUsername = faker.person.firstName();
	await loginUser(tempAttendeePage, attendeeEmail, attendeeUsername);

	await expect(tempAttendeePage.locator('.event-card')).toHaveCount(1);

	// Going to the URL should now link it to the account
	await navigateTo(tempAttendeePage, eventUrl);

	await expect(tempAttendeePage.getByRole('heading', { name: eventName })).toBeVisible();
	await tempAttendeePage.getByRole('link', { name: 'Dashboard' }).click();
	await expect(tempAttendeePage.locator('.event-card')).toHaveCount(1);
});

test('Event admins', async ({ browser }) => {
	const context1 = await browser.newContext();
	const context2 = await browser.newContext();
	const eventCreatorPage = await context1.newPage();
	const adminPage = await context2.newPage();

	await eventCreatorPage.goto(WEBSITE_URL);

	// Create event from creator POV
	const eventOwnerEmail = faker.internet.email();
	const eventOwnerUsername = faker.person.firstName();
	await loginUser(eventCreatorPage, eventOwnerEmail, eventOwnerUsername);

	const eventName = `${faker.animal.dog()} birthday party!`;
	const eventDetails = 'It will be fun!';
	await createBonfire(eventCreatorPage, eventName, eventDetails);
	await expect(eventCreatorPage.getByRole('heading', { name: eventName })).toBeVisible();

	const eventUrl = eventCreatorPage.url();

	// Sign up admin
	const adminEmail = faker.internet.email();
	// Adding "aaa" so user is always first in the list of attendees (user for later selection)
	const adminUsername = 'aaa' + faker.person.firstName();
	await loginUser(adminPage, adminEmail, adminUsername);

	await adminPage.goto(eventUrl);
	await expect(adminPage.getByText('1 going')).toBeVisible();
	await adminPage.getByText('RSVP', { exact: true }).click();
	await adminPage.locator('#rsvp-button-going').click();

	// Now event creator will add above attendee as an admin
	await eventCreatorPage.locator('#edit-bonfire').getByRole('button').click();
	await eventCreatorPage.getByRole('button', { name: 'Edit admins' }).click();
	await expect(eventCreatorPage.getByRole('heading', { name: 'Add an admin' })).toBeVisible();
	await expect(
		eventCreatorPage.getByRole('button', { name: 'Admin Permissions Toggle' })
	).toBeVisible();
	await eventCreatorPage.getByRole('button', { name: 'Admin Permissions Toggle' }).click();
	await expect(eventCreatorPage.getByText('Modify event details')).toBeVisible();
	await expect(eventCreatorPage.getByText('Remove attendees')).toBeVisible();
	await expect(eventCreatorPage.getByText('No admins yet')).toBeVisible();
	await eventCreatorPage.getByText('Select an attendee...').click();
	console.log('adminUsername', adminUsername);
	await eventCreatorPage.getByRole('option', { name: adminUsername }).click();
	await expect(eventCreatorPage.getByRole('heading', { name: adminUsername })).toBeVisible();
	await eventCreatorPage.close();

	// Check new admin can do the allowed admin tasks
	await adminPage.goto(eventUrl);

	// Go to event settings
	await expect(adminPage.locator('#edit-bonfire').getByRole('button')).toBeVisible();
	await adminPage.locator('#edit-bonfire').getByRole('button').click();
	// Update name
	const newEventName = eventName + ' new!';
	await adminPage.getByPlaceholder('Event Name').click();
	await adminPage.getByPlaceholder('Event Name').fill(newEventName);
	const newDetails = eventDetails + ' new!';
	await adminPage.getByPlaceholder('Details').click();
	await adminPage.getByPlaceholder('Details').fill(newDetails);
	// Hit update
	await expect(adminPage.getByRole('button', { name: 'Publish' })).toBeEnabled();
	await adminPage.waitForTimeout(100);
	await adminPage.getByRole('button', { name: 'Publish' }).click();
	// Check data
	await expect(adminPage.getByRole('heading', { name: eventName })).toBeVisible();
	await expect(adminPage.getByText(newDetails)).toBeVisible();

	// See if we can see the remove user screen
	await adminPage.locator('#going-attendees').locator('.profile-avatar').first().click();
	await adminPage.getByRole('button', { name: 'Remove user from event' }).click();
	await adminPage.getByRole('button', { name: 'Cancel' }).click();
	await adminPage.getByRole('button', { name: 'cross 2 Close' }).click();

	// Add an announcement
	const announcementText = faker.lorem.paragraph();
	await adminPage.getByRole('button', { name: 'Create new announcement' }).click();
	await adminPage.getByPlaceholder('Type your announcement here').click();
	await adminPage.getByPlaceholder('Type your announcement here').fill(announcementText);
	await adminPage.getByRole('button', { name: 'Create Announcement' }).click();
	await expect(adminPage.getByText(announcementText)).toBeVisible();

	// Upload a new banner image
	await adminPage.getByRole('button', { name: 'Set a banner image' }).click();
	await expect(adminPage.getByRole('heading', { name: 'Set Banner' })).toBeVisible();
	await expect(adminPage.getByRole('tab', { name: 'My Device' })).toBeVisible();
	await expect(adminPage.getByRole('tab', { name: 'Camera' })).toBeVisible();
	await expect(adminPage.getByText('Image only. Max size: 5MB.')).toBeVisible();

	const fileInput = await adminPage.locator('input[type="file"]').first();
	const imagePath = path.resolve(process.cwd(), 'e2e/test-images', 'banner.jpeg');
	await fileInput.setInputFiles(imagePath);
	await adminPage.getByRole('button', { name: 'Save', exact: true }).click();
	await adminPage.getByLabel('Upload 1 file').click();

	await expect(adminPage.getByRole('img', { name: 'Banner for large screens' })).toBeVisible();
	await expect(adminPage.getByLabel('Upload a new banner')).toBeVisible();
});

test('Bring list items', async ({ browser }) => {
	const context1 = await browser.newContext();
	const context2 = await browser.newContext();
	const eventCreatorPage = await context1.newPage();
	const tempAttendeePage = await context2.newPage();

	await eventCreatorPage.goto(WEBSITE_URL);

	// Create event from creator POV
	const eventOwnerEmail = faker.internet.email();
	const eventOwnerUsername = faker.person.firstName();
	await loginUser(eventCreatorPage, eventOwnerEmail, eventOwnerUsername);

	const eventName = `${faker.animal.dog()} birthday party!`;
	const eventDetails = 'It will be fun!';
	await createBonfire(eventCreatorPage, eventName, eventDetails);
	await expect(eventCreatorPage.getByRole('heading', { name: eventName })).toBeVisible();

	const eventUrl = eventCreatorPage.url();

	// Have temp attendee go to event and attend
	await tempAttendeePage.goto(eventUrl);
	await tempAttendeePage.getByText('RSVP', { exact: true }).click();
	await tempAttendeePage.getByRole('menuitem', { name: 'Going', exact: true }).click();
	await tempAttendeePage.getByPlaceholder('Tony Garfunkel').click();
	await tempAttendeePage.getByPlaceholder('Tony Garfunkel').fill('Matthieu');
	await tempAttendeePage.getByRole('button', { name: 'Generate URL' }).click();
	await expect(tempAttendeePage.getByRole('heading', { name: 'Hey There!' })).toBeVisible();

	// Have event owner create bring list items
	await eventCreatorPage.locator('#add-bring-list-item-btn').click();
	await eventCreatorPage.getByRole('textbox', { name: 'Item name' }).click();
	await eventCreatorPage.getByRole('textbox', { name: 'Item name' }).fill('Dogs');
	await eventCreatorPage.locator('#item-category-btn').click();
	await expect(eventCreatorPage.getByRole('menuitem', { name: 'By Person' })).toBeVisible();
	await expect(eventCreatorPage.getByRole('menuitem', { name: 'Total Count' })).toBeVisible();
	await eventCreatorPage.getByPlaceholder('5').fill('5');
	const bringItemDetails = 'Because dogs are fantastic';
	await eventCreatorPage
		.getByRole('textbox', { name: 'We need enough to feed 5' })
		.fill(bringItemDetails);
	await eventCreatorPage.getByLabel('Add list item').getByRole('button', { name: 'Add' }).click();
	await expect(
		eventCreatorPage.locator('.bring-list-item-btn').getByRole('button', { name: 'Dogs' })
	).toBeVisible();

	// Check tempAttendee can see it too
	await expect(
		tempAttendeePage.locator('.bring-list-item-btn').getByRole('button', { name: 'Dogs' })
	).toBeVisible();

	await eventCreatorPage
		.locator('.bring-list-item-btn')
		.getByRole('button', { name: 'Dogs' })
		.click();
	// Let event creator update the details
	await eventCreatorPage.locator('#edit-bring-list-item').click();
	const bringItemDetailsImproved = bringItemDetails + ', but cats are ok';
	await eventCreatorPage
		.getByRole('textbox', { name: 'We need enough to feed 5' })
		.fill(bringItemDetailsImproved);
	await eventCreatorPage.getByRole('button', { name: 'Save Changes' }).click();
	// Let event creator bring 1 dog
	const slider = eventCreatorPage.locator('input[type="range"]');
	await expect(slider).toBeAttached(); // Ensure it's in the DOM
	await expect(slider).toBeVisible();
	await expect(slider).toBeEnabled();
	await slider.evaluate((el) => {
		el.value = 1;
		el.dispatchEvent(new Event('input', { bubbles: true })); // Ensure event triggers
	});
	await eventCreatorPage.getByRole('button', { name: 'Submit' }).click();

	// Let temp attendee bring one dog, and verify the details is updated
	await tempAttendeePage
		.locator('.bring-list-item-btn')
		.getByRole('button', { name: 'Dogs' })
		.click();
	await expect(tempAttendeePage.getByText(bringItemDetailsImproved)).toBeVisible();
	const slider2 = tempAttendeePage.locator('input[type="range"]');

	await expect(slider2).toBeAttached(); // Ensure it's in the DOM
	await expect(slider2).toBeVisible();
	await expect(slider2).toBeEnabled();

	await slider2.evaluate((el) => {
		el.value = 1;
		el.dispatchEvent(new Event('input', { bubbles: true })); // Ensure event triggers
	});
	await tempAttendeePage.getByRole('button', { name: 'Submit' }).click();

	// Check event owner can see who's bringing what
	await eventCreatorPage
		.locator('.bring-list-item-btn')
		.getByRole('button', { name: 'Dogs' })
		.click();
	await expect(eventCreatorPage.getByText('bringing for')).toHaveCount(2, { timeout: 2000 });
	await expect(eventCreatorPage.getByText("You're bringing enough for 1 person")).toBeVisible();

	// Have event owner delete bring list item and check it's gone
	await eventCreatorPage.locator('#edit-bring-list-item').click();
	await eventCreatorPage.locator('#delete-bring-item').click();
	await eventCreatorPage.getByRole('button', { name: 'Continue' }).click();
	await expect(eventCreatorPage.getByText('.bring-list-item-btn')).toHaveCount(0);
});

test('Consume logs', async ({ page }) => {
	const email = faker.internet.email();
	const username = faker.person.firstName() + '123456789';
	await loginUser(page, email, username);

	await page.getByRole('link', { name: 'Profile' }).click();
	await expect(page.getByText('You have 3 logs remaining.')).toBeVisible();

	// Create 1st bonfire
	let eventName = `${faker.animal.dog()} birthday party!`;
	await createBonfire(page, eventName);
	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();
	await expect(page.getByText('Not Published')).toBeHidden();

	await page.getByRole('link', { name: 'Dashboard' }).click();
	await expect(page.getByText('Not Published')).toBeHidden();
	await expect(page.locator('.event-card')).toHaveCount(1);

	await page.getByRole('link', { name: 'Profile' }).click();
	await expect(page.getByText('You have 2 logs remaining.')).toBeVisible();

	// Create 2nd bonfire
	eventName = `${faker.animal.dog()} birthday party!`;
	await createBonfire(page, eventName);
	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();

	await page.getByRole('link', { name: 'Profile' }).click();
	await expect(page.getByText('You have 1 log remaining.')).toBeVisible();

	// Create 3rd bonfire
	eventName = `${faker.animal.dog()} birthday party!`;
	await createBonfire(page, eventName);
	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();

	await page.getByRole('link', { name: 'Profile' }).click();
	await expect(page.getByText('You have 0 log remaining.')).toBeVisible();
});

test('Add logs', async ({ page }) => {
	const email = faker.internet.email();
	const username = faker.person.firstName() + '123456789';
	await loginUser(page, email, username);

	const nonProfitName = faker.company.name();
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	// Create a non-profit for testing.
	await serverTriplitClient.insert('non_profits', {
		name: nonProfitName,
		description: 'A description',
		photo_url: '/',
		website_url: 'http://abc.com',
		effective_start_date: oneWeekAgo
	});

	await page.getByRole('link', { name: 'Profile' }).click();
	await page.getByRole('button', { name: 'Buy more logs' }).click();
	await expect(page.getByRole('heading', { name: 'Buy more logs' })).toBeVisible();
	await expect(page.getByText('Choose a Cause & Make an')).toBeVisible();
	await page.getByRole('button', { name: 'Select Cause' }).click();

	// User now needs to select a non-profit to support
	await page.locator('.non-profit-card').first().click();
	await page.locator('.back-button').first().click();

	// Back to "Buy more logs"
	await expect(page.getByRole('heading', { name: 'Buy more logs' })).toBeVisible();

	// Test button to update non-profit
	await page.getByRole('button', { name: 'Change the cause you support' }).click();
	await expect(page.getByRole('heading', { name: 'Support a Cause' })).toBeVisible();
	await page.locator('.back-button').first().click();

	// Back to "Buy more logs"
	await expect(page.getByRole('heading', { name: 'Buy more logs' })).toBeVisible();
	await expect(page.getByRole('button', { name: '$1 for 1 log' })).toBeVisible();
	await expect(page.getByRole('button', { name: '$2 for 3 logs' })).toBeVisible();
	await expect(page.getByRole('button', { name: '$5 for 10 logs' })).toBeVisible();

	const userEntry = await serverTriplitClient.fetchOne(
		serverTriplitClient.query('user').where('username', '=', username).build()
	);
	expect(userEntry).not.toBeNull();
	console.log('userEntry ====>', userEntry);

	const userLogTokenEntry = await serverTriplitClient.fetchOne(
		serverTriplitClient
			.query('user_log_tokens')
			.where('user_id', '=', userEntry?.id as string)
			.build()
	);
	expect(userLogTokenEntry).not.toBeNull();
	console.log('userLogTokenEntry ====>', userLogTokenEntry);

	// Give more logs to user (don't go through Stripe for testing)
	await serverTriplitClient.update(
		'user_log_tokens',
		userLogTokenEntry?.id as string,
		async (e) => {
			e.num_logs = e.num_logs + 3;
		}
	);

	await page.getByRole('link', { name: 'Profile' }).click();
	await expect(page.getByText('You have 6 logs remaining.')).toBeVisible();
});

// TODO: test max capacity of bonfire
// TODO: only logged in "users" can message, not temp users
