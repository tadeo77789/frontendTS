import { expect, test } from '@playwright/test';
import { createActiveUser, loginFromLanding, saveTranslation } from './support';

test('una traducción guardada aparece en el historial y se puede borrar', async ({ page }) => {
  const { email, token } = await createActiveUser();
  await saveTranslation(token, 'hola e2e');

  await loginFromLanding(page, email);
  await page.getByLabel('Historial', { exact: true }).first().click();

  await expect(page.getByText('hola e2e')).toBeVisible();
  await page.getByLabel('Eliminar', { exact: true }).click();
  await page.locator('.swal2-confirm').click();

  await expect(page.getByText('hola e2e')).toHaveCount(0);
  await expect(page.getByText('Sin traducciones')).toBeVisible();
});
