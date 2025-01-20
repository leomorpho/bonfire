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

	await page.getByRole('button', { name: 'Create' }).click();

	await expect(page.getByRole('heading', { name: eventName })).toBeVisible();
});
