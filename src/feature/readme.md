# screens — Pantallas de la Aplicación

Contiene todas las pantallas de la aplicación organizadas por módulo funcional.

## Estructura

```
screens/
├── LandingScreen.tsx      → Pantalla de bienvenida (carrusel de imágenes, testimonios, botones de acción)
├── Auth/                  → Flujo de autenticación
├── Translation/           → Pantalla principal de traducción
├── Alphabet/              → Alfabeto de señas colombianas
├── Stats/                 → Estadísticas de uso
├── History/               → Historial de traducciones
└── Profile/               → Perfil y configuración del usuario
```

## Pantallas por módulo

### `LandingScreen.tsx`
Pantalla de inicio para usuarios no autenticados. Muestra un slider de imágenes, el mensaje de inclusión social, un testimonio de usuario y botones para registrarse o iniciar sesión. También muestra una notificación emergente de aviso.

### `Auth/`
Flujo completo de autenticación con 5 pantallas encadenadas:

| Pantalla | Descripción |
|---|---|
| `LoginScreen.tsx` | Formulario de correo y contraseña. Incluye botones de Google y Facebook |
| `RegisterScreen.tsx` | Formulario de registro con nombre, correo, contraseña y aceptación de términos |
| `ForgotPasswordScreen.tsx` | Ingreso de correo para recibir código de recuperación |
| `VerifyCodeScreen.tsx` | Ingreso del código OTP de 6 dígitos recibido por correo |
| `NewPasswordScreen.tsx` | Formulario para establecer la nueva contraseña |

### `Translation/`
| Pantalla | Descripción |
|---|---|
| `TranslationScreen.tsx` | Pantalla principal con toggle **Seña ↔ Texto**. En modo *Seña→Texto* activa la cámara para detectar señas. En modo *Texto→Seña* muestra un avatar 3D con la representación de la seña |

### `Alphabet/`
| Pantalla | Descripción |
|---|---|
| `AlphabetScreen.tsx` | Grid con las 26 letras del alfabeto dactilológico colombiano (A-Z), con imagen de cada seña. Toca una letra para verla ampliada |

### `Stats/`
| Pantalla | Descripción |
|---|---|
| `StatsScreen.tsx` | Dashboard con 4 gráficas: actividad semanal (barras), crecimiento mensual (línea), volumen de traducciones (barras) y distribución por sección (torta) |

### `History/`
| Pantalla | Descripción |
|---|---|
| `HistoryScreen.tsx` | Lista del historial de traducciones con texto, fecha y hora. Permite reusar o eliminar cada entrada (borrado lógico) |

### `Profile/`
| Pantalla | Descripción |
|---|---|
| `ProfileScreen.tsx` | Muestra correo y contraseña del usuario. Permite alternar el **acento de color** (Morado / Verde), cambiar tema claro/oscuro, seleccionar idioma de la interfaz, cerrar sesión y eliminar la cuenta. Da acceso a `Terms` y `PrivacyPolicy` |
| `TermsScreen.tsx` | Términos y condiciones de uso (9 secciones legales). Se accede desde Perfil → Términos y condiciones |
| `PrivacyPolicyScreen.tsx` | Política de privacidad alineada con la Ley 1581 de 2012 (11 secciones). Se accede desde Perfil → Política de privacidad |

> Las pantallas internas usan `useColors()` del `ThemeContext` para que cualquier acento (púrpura/verde) o modo (claro/oscuro) se aplique sin filtraciones de morado.
