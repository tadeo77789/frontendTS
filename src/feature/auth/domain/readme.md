# business — Lógica de Negocio

Contiene los **casos de uso** y reglas de negocio de la aplicación, separados de la interfaz de usuario y del acceso a datos.

## Propósito

Esta capa actúa como intermediaria entre la capa de presentación (pantallas) y la capa de datos (API). Aquí se implementan las reglas específicas del dominio sin depender de frameworks de UI.

## Archivos esperados

| Archivo | Descripción |
|---|---|
| `TranslationUseCase.ts` | Lógica para procesar los tres modos de traducción: seña→texto, texto→seña, voz→seña |
| `AuthUseCase.ts` | Reglas de registro, inicio de sesión, logout y recuperación de contraseña |
| `LexiconUseCase.ts` | Búsqueda y consulta del léxico de la Lengua de Señas Colombiana |
| `StatsUseCase.ts` | Cálculo y agregación de estadísticas de uso por usuario |
| `ProfileUseCase.ts` | Actualización de perfil, cambio de tema e idioma con soporte de deshacer (patrón Command) |

## Patrones de diseño aplicados en esta capa

| Patrón | Aplicación |
|---|---|
| **Factory Method** | `TraduccionFactory` crea objetos `Traduccion` según el tipo (texto/seña/voz) |
| **Command** | `InvokerPerfil` ejecuta y deshace acciones de configuración del perfil |
| **Observer** | `GestorEventos` notifica a observadores cuando ocurren traducciones o eventos de navegación |
