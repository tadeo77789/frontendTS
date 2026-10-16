# utils — Utilidades

Funciones auxiliares reutilizables que no pertenecen a ninguna capa específica del sistema.

## Archivos esperados

| Archivo | Descripción |
|---|---|
| `helpers.ts` | Funciones genéricas: formateo de fechas, validación de correos, capitalización de texto |
| `dateFormatter.ts` | Conversión de timestamps a formatos legibles en español (`07/12/25`, `11:00`) |
| `validators.ts` | Validaciones de formularios: email, contraseña mínima, campos obligatorios |
| `permissions.ts` | Solicitud y verificación de permisos del dispositivo (cámara, micrófono) |

## Ejemplos de funciones esperadas

```ts
// Formatear fecha de traducción
formatDate('2025-12-07T11:00:00') // → '07/12/25  11:00'

// Validar email
isValidEmail('user@example.com')  // → true

// Truncar texto largo
truncate('hola me llamo juan', 12) // → 'hola me ll...'
```

## Criterio para agregar utilidades

Solo se agrega una función aquí si es **reutilizada en más de una pantalla o componente**. Las funciones de un solo uso se escriben directamente en el archivo que las necesita.
