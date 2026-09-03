# state — Estado Global de la Aplicación

Contiene los contextos de React que gestionan el estado compartido entre pantallas.

## Archivos

| Archivo | Descripción |
|---|---|
| `AuthContext.tsx` | Estado de autenticación: usuario actual, token JWT, funciones de login/register/logout |
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

El token se persiste en `AsyncStorage` para mantener la sesión entre reinicios de la app.

## Detalle de `ThemeContext.tsx`

Provee el hook `useTheme()` con:

| Propiedad / Función | Descripción |
|---|---|
| `mode` | `'light'` o `'dark'` |
| `isDark` | Booleano de acceso rápido |
| `toggleTheme()` | Alterna entre tema claro y oscuro |
