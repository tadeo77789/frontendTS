# config — Configuración de la Aplicación

Contiene los archivos de configuración global de la app: URLs del backend, constantes de entorno y parámetros de conexión.

## Archivos

| Archivo | Descripción |
|---|---|
| `api.config.ts` | URL base del backend, timeout de peticiones y mapa de todos los endpoints disponibles |

## Detalle de `api.config.ts`

```ts
API_BASE_URL  // URL del servidor (localhost en desarrollo, dominio real en producción)
API_TIMEOUT   // Tiempo máximo de espera por respuesta: 10 segundos
ENDPOINTS     // Objeto con todas las rutas de la API organizadas por módulo
```

### Endpoints definidos

| Módulo | Endpoints |
|---|---|
| **Auth** | login, register, logout, forgot-password, verify-code, reset-password |
| **Traducciones** | translate, history, deleteTranslation |
| **Léxico** | lexicon, lexiconSearch |
| **Estadísticas** | stats |
| **Perfil** | profile, updateProfile, deleteAccount |

## Nota de entorno

- En desarrollo (Android emulador): `http://10.0.2.2:3000/api`
- En producción: URL del servidor real configurada según despliegue
