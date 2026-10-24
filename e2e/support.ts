/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080/api';
const BACKEND_DIR = process.env.E2E_BACKEND_DIR ?? '../backendTS';

export const PASSWORD = 'E2e-Prueba1!';

/** Correo único por prueba: la base de prueba se reutiliza entre pruebas. */
export const newEmail = () => `e2e-${randomUUID().slice(0, 8)}@example.com`;

/**
 * Activa la cuenta directo en la base de prueba. En el CI no hay SMTP y el código de
 * verificación se guarda cifrado, así que no se puede leer: se marca el correo como verificado.
 */
export const activateAccount = (email: string) => {
  const sql = `UPDATE public.users SET status = 'ACTIVE', email_verified_at = NOW() WHERE email = :'email';`;
  const out = execFileSync(
    'docker',
    ['compose', 'exec', '-T', 'postgres-iam', 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-v', `email=${email}`, '-U', 'postgres', '-d', 'iam'],
    { cwd: BACKEND_DIR, input: sql, encoding: 'utf8' },
  );
  expect(out).toContain('UPDATE 1');
};

const post = async (path: string, body: unknown, token?: string) => {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json as { data: Record<string, unknown> };
};

/** Crea por la API una cuenta activa, para las pruebas que no son del registro. */
export const createActiveUser = async () => {
  const email = newEmail();
  await post('/auth/register', { name: 'Prueba E2E', email, password: PASSWORD, acceptedTerms: true, termsVersion: '2025-01' });
  activateAccount(email);
  const { data } = await post('/auth/login', { email, password: PASSWORD });
  return { email, token: data.token as string };
};

/** Guarda una traducción como lo hace la pantalla de traducción. */
export const saveTranslation = (token: string, text: string) =>
  post('/translations', { inputText: text, outputText: text, type: 'sena_texto', confidence: 0.9, source: 'e2e', mode: 'words' }, token);

/** Entra desde la página pública con correo y contraseña. */
export const loginFromLanding = async (page: Page, email: string) => {
  await page.goto('/');
  await page.getByLabel('Iniciar sesión').click();
  await page.getByPlaceholder('tucorreo@ejemplo.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByText('Ingresar', { exact: true }).last().click();
  // Con sesión aparece la barra de pestañas.
  await expect(page.getByLabel('Historial', { exact: true }).first()).toBeVisible();
};
