import { expect, test } from '@playwright/test';

function uniqueEmail() {
  return `planner-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

test('registers, plans tasks, shows suggestion, and tracks progress', async ({ page }) => {
  const email = uniqueEmail();

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Focus the day around the task that matters most.')).toBeVisible();

  await page.getByLabel('Task title').fill('Write project brief');
  await page.getByLabel('Priority').selectOption('high');
  await page.getByLabel('Estimated time').selectOption('30');
  await page.getByRole('button', { name: 'Add task' }).click();

  await page.getByLabel('Task title').fill('Review dependency list');
  await page.getByLabel('Priority').selectOption('medium');
  await page.getByLabel('Estimated time').selectOption('15');
  await page.getByRole('button', { name: 'Add task' }).click();

  await page.getByLabel('Task title').fill('Plan release notes');
  await page.getByLabel('Priority').selectOption('low');
  await page.getByLabel('Estimated time').selectOption('60');
  await page.getByRole('button', { name: 'Add task' }).click();

  await expect(page.getByTestId('suggestion-banner')).toContainText('Write project brief');
  await expect(page.getByTestId('task-item')).toHaveCount(3);

  await page.getByTestId('task-item').first().getByRole('button', { name: 'Complete' }).click();

  await expect(page.getByTestId('suggestion-banner')).toContainText('Review dependency list');
  await expect(page.getByText('1/3')).toBeVisible();
  await expect(page.getByText('33%')).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
