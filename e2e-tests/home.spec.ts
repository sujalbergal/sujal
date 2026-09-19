import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Tailspin Toys - Crowdfunding your new favorite game!');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome to Tailspin Toys', exact: true })).toBeVisible();
  });

  test('should display the site branding in header', async ({ page }) => {
    await expect(page.getByText('Tailspin Toys').first()).toBeVisible();
  });

  test('should display the welcome message', async ({ page }) => {
    await expect(page.getByText('Find your next game! And maybe even back one! Explore our collection!')).toBeVisible();
  });

  test('should filter games by category and publisher', async ({ page }) => {
    const strategyFilter = page.getByRole('checkbox', { name: 'Strategy' });
    const publisherFilter = page.getByTestId('publisher-filter');

    await test.step('Filter by a category', async () => {
      await strategyFilter.check();
      await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(4);
      await expect(page.getByTestId('filter-results-count')).toHaveText('4 games found');
    });

    await test.step('Combine the category with a publisher', async () => {
      await publisherFilter.selectOption({ label: 'CodeForge Studios' });
      await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(1);
      await expect(page.getByTestId('game-title').filter({ hasText: 'DevOps Dominion' })).toBeVisible();
      await expect(page.getByTestId('filter-results-count')).toHaveText('1 game found');
    });

    await test.step('Reset the filters', async () => {
      await page.getByTestId('clear-filters').click();
      await expect(page.getByRole('checkbox', { name: 'Strategy' })).not.toBeChecked();
      await expect(page.getByTestId('publisher-filter')).toHaveValue('');
    });
  });
});
