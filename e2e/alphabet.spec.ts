import { expect, test } from '@playwright/test';
import { createActiveUser, loginFromLanding } from './support';

test('el abecedario abre la seña de una letra', async ({ page }) => {
  const { email } = await createActiveUser();
  await loginFromLanding(page, email);
  await page.getByLabel('Alfabeto', { exact: true }).first().click();

  await page.getByLabel('Ver la seña de la letra A', { exact: true }).click();
  await expect(page.getByText('Seña: A')).toBeVisible();
});
