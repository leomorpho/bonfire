import { test, expect } from '@playwright/test';
import { WEBSITE_URL } from './shared';

test('New visitor', async ({ page }) => {
	await page.goto(WEBSITE_URL);

	await expect(page.getByRole('banner').getByRole('link', { name: 'About' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
	await page.getByRole('link', { name: 'FAQ' }).click();
	await expect(page.getByRole('link', { name: 'FAQ' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'login' })).toBeVisible();
	await page.getByRole('link', { name: 'login' }).click();
	await expect(page.getByPlaceholder('Email')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
});
