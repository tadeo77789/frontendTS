# services — Servicios Externos

Contiene la integración con servicios del dispositivo y servicios externos de terceros.

## Archivos esperados

| Archivo | Descripción |
|---|---|
| `api.service.ts` | Instancia global de Axios con interceptores de autenticación (agrega el token JWT a cada petición) |
| `camera.service.ts` | Control de la cámara del dispositivo para capturar frames de señas en tiempo real |
| `audio.service.ts` | Grabación de audio del micrófono para el modo voz→seña |
| `notification.service.ts` | Registro de tokens FCM/APNs y manejo de notificaciones push (expo-notifications) |
| `storage.service.ts` | Abstracción sobre AsyncStorage y SecureStore para persistencia local |
| `ai.service.ts` | Comunicación con el módulo de inteligencia artificial para reconocimiento de señas |

## Servicios externos integrados

| Servicio | Propósito |
|---|---|
| **expo-camera** | Captura de video en tiempo real para reconocimiento de señas |
| **expo-av** | Grabación y reproducción de audio |
| **expo-notifications** | Notificaciones push en dispositivos Android e iOS |
| **FCM / APNs** | Entrega de notificaciones push (Firebase para Android, Apple para iOS) |
| **OAuth (Google/Facebook)** | Inicio de sesión con redes sociales |
