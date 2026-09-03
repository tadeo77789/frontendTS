# components — Componentes Reutilizables

Contiene los componentes de interfaz de usuario que se usan en múltiples pantallas de la aplicación.

## Estructura

```
components/
└── common/          → Componentes base del sistema de diseño
```

## Carpeta `common/`

| Archivo | Descripción |
|---|---|
| `AppHeader.tsx` | Barra de encabezado con logo "TraduceSeña" y botón de perfil. Se oculta automáticamente en web (la navegación web está en `WebTopBar`). Usa `C.gradientPrimary` y `C.primary` del tema activo |
| `Button.tsx` | Botón reutilizable con 5 variantes: `primary`, `secondary`, `danger`, `outline`, `ghost`. Soporta estado de carga y deshabilitado |
| `Input.tsx` | Campo de texto con soporte para: etiqueta, ícono izquierdo/derecho, modo contraseña (ojo), mensajes de error y pistas |
| `WebTopBar.tsx` | Barra de navegación horizontal superior para la versión web. Muestra el logo, los enlaces de navegación con subrayado activo y el avatar de perfil |
| `Card.tsx` | Tarjeta reutilizable con variantes `flat` / `elevated`. Fondo y borde derivan de `useColors()` |
| `Badge.tsx` | Píldora compacta para conteos o etiquetas (ej. "26 letras", "3 registros"). Acepta `color`/`background` o usa el acento del tema |
| `Chip.tsx` | Chip seleccionable con icono opcional. Útil para filtros de idioma o consejos. Estado activo derivado del tema |

### Ejemplo de uso

```tsx
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Chip } from '../../components/common/Chip';

<Card variant="elevated">
  <Badge label="26 letras" />
  <Chip label="Español" active onPress={() => setLang('es')} />
</Card>
```

## Criterio para crear un componente aquí

Un componente se coloca en `common/` cuando:
- Se usa en **2 o más pantallas distintas**
- Forma parte del **sistema de diseño** visual (colores, tamaños, tipografía del mockup)
- Es independiente de la lógica de negocio

Los componentes específicos de una sola pantalla se crean directamente dentro de esa pantalla.
