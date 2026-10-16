# constants — Constantes Globales

Define los valores fijos reutilizables en toda la aplicación: colores, tamaños, textos e tokens de diseño avanzados.

## Archivos

| Archivo | Descripción |
|---|---|
| `colors.ts` | Paleta de colores completa del diseño (basada en el mockup oficial) |
| `sizes.ts` | Tamaños de fuentes, espaciados, radios de borde y alturas de componentes |
| `strings.ts` | Todos los textos visibles en la app centralizados para fácil traducción |
| `theme.ts` | Tokens de diseño avanzados: `Spacing`, `FontSize`, `BorderRadius`, `Shadows`, `ZIndex`, `ComponentSizes`, `Animation` |

## Detalle de `colors.ts`

El archivo expone **cuatro paletas** y se consume desde los componentes mediante el hook `useColors()` de `state/ThemeContext`, que devuelve la paleta correcta según el modo (claro/oscuro) y el acento (púrpura/verde) seleccionados por el usuario en Perfil:

| Paleta | Cuándo aplica |
|---|---|
| `Colors` | Modo claro + acento púrpura (default) |
| `DarkColors` | Modo oscuro + acento púrpura |
| `GreenColors` | Modo claro + acento verde |
| `GreenDarkColors` | Modo oscuro + acento verde — superficies con sutil tinte verde para que el modo oscuro no se sienta púrpura/azulado |

Tokens semánticos principales (valores del modo claro púrpura):

| Token | Color púrpura | Color verde | Uso |
|---|---|---|---|
| `primary` | `#7C3AED` | `#4CAF82` | Botones principales, acentos, toggles activos |
| `primaryLight` | `#ab82f2` | `#7DC8A0` | Iconos secundarios, estados hover |
| `primaryLighter` | `#bd9ef2` | `#A8D8BC` | Bordes de toggle, dots, avatar |
| `primaryBg` | `#EDE9FE` | `#E8F5EE` | Fondo de pantallas de auth (Login/Registro) |
| `primaryHeader` | `#c6adf2` | `#C3E6D0` | Fondo de la barra de navegación |
| `background` | `#FFFFFF` | `#FFFFFF` | Fondo general |
| `backgroundGray` | `#F9FAFB` | `#F9FAFB` | Fondo exterior en versión web |
| `inputBg` | `#F3F4F6` | `#F3F4F6` | Fondo de campos de texto |
| `error` / `danger` | `#EF4444` | `#EF4444` | Errores y acciones destructivas |
| `toggleOn` | `#7C3AED` | `#4CAF82` | Switch activo |
| `toggleOff` | `#D1D5DB` | `#D1D5DB` | Switch inactivo |
| `facebook` | `#1877F2` | `#1877F2` | Botón de Facebook (Login) |

> El acento (púrpura/verde) **solo cambia las pantallas internas** (Translation, Alphabet, Stats, History, Profile, Términos, Privacidad y headers). Login/Registro/Landing mantienen el morado de marca.

### Cómo usar la paleta en un componente

```tsx
import { useColors } from '../../../state/ThemeContext';

const MyComponent = () => {
  const C = useColors();
  return <View style={{ backgroundColor: C.surface, borderColor: C.primary }} />;
};
```

Evita importar `Colors` directamente para no filtrar morado cuando el usuario está en tema verde u oscuro.

## Detalle de `sizes.ts`

Espaciados (`xs` a `xxl`), tipografía (`fontXs` a `fontDisplay`), radios de borde y dimensiones de componentes estándar como inputs (52px) y botones (52px).

## Detalle de `strings.ts`

Centraliza más de 80 textos de la interfaz agrupados por sección: auth, tabs, traducción, léxico, historial, perfil, notificaciones, errores y acciones.

## Detalle de `theme.ts`

Tokens más granulares que `sizes.ts`. Úsalos cuando necesites valores precisos de animación, sombras o z-index:

| Objeto | Ejemplos de propiedades |
|---|---|
| `Spacing` | `xs`, `sm`, `md`, `lg`, `xl`, `xxl` |
| `FontSize` | `xs` (11) a `display` (36) |
| `BorderRadius` | `sm` (8) a `full` (999) |
| `Shadows` | `sm`, `md`, `lg` — objetos con `shadowColor`, `elevation`, etc. |
| `ZIndex` | `base`, `dropdown`, `modal`, `toast` |
| `ComponentSizes` | `inputHeight`, `buttonHeight`, `tabBarHeight`, `headerHeight` |
| `Animation` | `fast` (150ms), `normal` (300ms), `slow` (500ms) |
