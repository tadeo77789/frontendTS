import { expect, test } from '@playwright/test';
import { PASSWORD, activateAccount, loginFromLanding, newEmail } from './support';

test('registro con consentimiento, verificación y login', async ({ page }) => {
  const email = newEmail();
  await page.goto('/');
  await page.getByText('Registrarse', { exact: true }).first().click();

  await page.getByPlaceholder('Escribe tu nombre completo').fill('Prueba E2E');
  await page.getByPlaceholder('Introduce tu correo electrónico').fill(email);
  await page.getByPlaceholder('Mínimo 8 caracteres').fill(PASSWORD);

  // Sin aceptar los términos el formulario no se envía.
  await page.getByText('Registrarse', { exact: true }).last().click();
  await expect(page.getByText('Verifica tu identidad')).toHaveCount(0);

  // Clic al inicio de la frase: el enlace de los términos abre otra pantalla.
  await page.getByText(/^Acepto los/).click({ position: { x: 5, y: 8 } });
  await page.getByText('Registrarse', { exact: true }).last().click();

  // En el CI no hay SMTP: la app avisa que no envió el código y abre la verificación.
  await expect(page.locator('.swal2-popup')).toBeVisible();
  await page.locator('.swal2-confirm').click();
  await expect(page.getByText('Verifica tu identidad')).toBeVisible();

  activateAccount(email);
  await loginFromLanding(page, email);
});

test('login con contraseña equivocada muestra el error y no entra', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Iniciar sesión').click();
  await page.getByPlaceholder('tucorreo@ejemplo.com').fill(newEmail());
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByText('Ingresar', { exact: true }).last().click();

  await expect(page.locator('.swal2-popup')).toBeVisible();
  await expect(page.getByLabel('Historial', { exact: true })).toHaveCount(0);
});
