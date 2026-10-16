# navigation — Navegación

Define la estructura de navegación de la aplicación usando **React Navigation**.

## Archivos

| Archivo | Descripción |
|---|---|
| `AppNavigator.tsx` | Navegador raíz. Decide si mostrar el flujo de autenticación o el flujo principal según si el usuario está autenticado. Muestra un indicador de carga mientras recupera la sesión guardada |
| `AuthNavigator.tsx` | Stack de pantallas de autenticación: Landing → Login → Register → ForgotPassword → VerifyCode → NewPassword |
| `MainTabNavigator.tsx` | Navegador de tabs principales. En **móvil** muestra tabs en la parte inferior. En **web** renderiza `WebTopBar` como barra horizontal superior |

## Flujo de navegación

```
AppNavigator
├── No autenticado → AuthNavigator (Stack)
│   ├── LandingScreen     (pantalla inicial)
│   ├── LoginScreen
│   ├── RegisterScreen
│   ├── ForgotPasswordScreen
│   ├── VerifyCodeScreen  (código OTP de 6 dígitos)
│   └── NewPasswordScreen
│
└── Autenticado → MainTabNavigator (Tabs)
    ├── TranslationScreen  (Traducción)
    ├── AlphabetScreen     (Alfabeto LSC)
    ├── StatsScreen        (Estadística)
    ├── HistoryScreen      (Historial)
    └── ProfileScreen      (Perfil)
```

## Comportamiento en web vs móvil

| Plataforma | Tab bar |
|---|---|
| Móvil (Android/iOS) | Barra de tabs en la **parte inferior** de la pantalla |
| Web | Barra horizontal en la **parte superior** (igual al mockup), con logo y links de navegación |
