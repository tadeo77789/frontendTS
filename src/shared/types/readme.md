# types — Tipos TypeScript

Define todas las interfaces y tipos compartidos en la aplicación para garantizar consistencia y seguridad de tipos.

## Archivos

| Archivo | Descripción |
|---|---|
| `index.ts` | Tipos principales del dominio: usuario, traducción, léxico, notificaciones |

## Tipos definidos en `index.ts`

| Tipo / Interfaz | Descripción |
|---|---|
| `User` | Datos del usuario: id, nombre, edad, email, tema, idioma, términos aceptados |
| `AuthState` | Estado de autenticación: usuario, token, flags de carga y autenticación |
| `LoginPayload` | Datos para iniciar sesión: email y contraseña |
| `RegisterPayload` | Datos para registro: nombre, edad, email, contraseña, aceptación de términos |
| `TipoTraduccion` | Unión: `'texto_sena' \| 'sena_texto' \| 'voz_sena'` |
| `Traduccion` | Registro de una traducción: texto entrada/salida, tipo, fecha, borrado lógico |
| `TipoLexico` | Unión: `'letra' \| 'numero' \| 'palabra' \| 'frase'` |
| `LexicoSena` | Entrada del léxico: palabra, tipo, letra, idioma, recursos multimedia |
| `RecursoMultimedia` | Archivo asociado a una seña: tipo, url, mime_type, orden |
| `Notificacion` | Notificación push: título, cuerpo, leída, fecha |
| `ThemeMode` | Unión: `'light' \| 'dark'` |
| `ApiResponse<T>` | Envoltorio genérico de respuestas del backend |
| `PaginatedResponse<T>` | Respuesta paginada con items, total, página y límite |

## Correspondencia con la base de datos

Los tipos reflejan directamente las tablas del modelo MySQL, facilitando el mapeo entre la API REST y la interfaz de usuario.
