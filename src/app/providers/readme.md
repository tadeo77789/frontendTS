# state — Estado Global de la Aplicación

Contiene los contextos de React que gestionan el estado compartido entre pantallas.

## Archivos

| Archivo | Descripción |
|---|---|
| `AuthContext.tsx` | Estado de autenticación: usuario actual, token JWT, funciones de login/register/logout |
| `AccessContext.tsx` | Roles y permisos del usuario (IAM): `useAccess()` y `useAdminMode()` |
| `ThemeContext.tsx` | Estado del tema visual: claro u oscuro, función para cambiar entre ambos |

## Detalle de `AuthContext.tsx`

Provee el hook `useAuth()` con:

| Propiedad / Función | Tipo | Descripción |
|---|---|---|
| `user` | `User \| null` | Datos del usuario autenticado |
| `token` | `string \| null` | Token JWT para peticiones al backend |
| `isAuthenticated` | `boolean` | Indica si hay sesión activa |
| `isLoading` | `boolean` | Verdadero mientras carga la sesión guardada |
| `login(payload)` | función | Autentica al usuario y guarda el token |
| `register(payload)` | función | Crea una cuenta nueva |
| `logout()` | función | Cierra sesión y limpia el almacenamiento |

Login y registro usan el backend real (registro seguido de login automático). Al arrancar, si hay token guardado se valida con `GET /users/me`; un 401 limpia la sesión. Un 401 posterior dispara `setUnauthorizedHandler` (logout local + aviso `sessionExpired`). No hay endpoint de logout: es local. El token se guarda en `expo-secure-store` (nativo) o en el almacenamiento del navegador (web), vía `shared/services/api.client.ts`.

## Detalle de `AccessContext.tsx`

Se monta dentro de `AuthProvider`. Con sesion valida carga `GET /iam/me/access` una sola vez por token y lo limpia al cerrar sesion. `useAccess()` devuelve `{ roles, permissions, isLoading, error, hasPermission(p), refresh() }`. Si la carga falla, se deniega por defecto (sin permisos) y se avisa una vez con `accessLoadError`. `useAdminMode()` deriva las pestanas: con `users.manage` modo admin (Stats si `stats.read`, Admin si `users.manage`/`models.manage`); si no, pestanas normales. El interruptor de notificaciones del perfil exige `notifications.manage`.

## Detalle de `ThemeContext.tsx`

Provee el hook `useTheme()` con:

| Propiedad / Función | Descripción |
|---|---|
| `mode` | `'light'` o `'dark'` |
| `isDark` | Booleano de acceso rápido |
| `toggleTheme()` | Alterna entre tema claro y oscuro |
