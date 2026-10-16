# services — Servicios compartidos

| Archivo | Descripción |
|---|---|
| `api.client.ts` | Instancia axios única (`api`), interceptor Bearer (solo hacia `API_BASE_URL` y solo si hay token), `setUnauthorizedHandler(fn)` para el 401 (una vez por sesión; `resetUnauthorizedGuard()` al iniciar sesión), `normalizeApiError(err)` → `{status?, code}` sin cuerpos, `tokenStorage` (SecureStore en nativo, almacenamiento del navegador en web) y `userStorage`. |
