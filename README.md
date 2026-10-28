# Traduce Señas

Aplicación multiplataforma que traduce **Lengua de Señas Colombiana (LSC) a texto y voz en tiempo real**, usando la cámara del dispositivo y un modelo de visión por computador que corre directamente en el cliente.

Construida con **Expo + React Native + TypeScript**, funciona desde una sola base de código en **Android, iOS y Web**.

- **Producción:** <https://traducesenas.tech>
- **APK de Android:** <https://tadeo77789.github.io/traducesenas-download/>
- **Backend:** [mauro-1508/backendTS](https://github.com/mauro-1508/backendTS) · **Documentación:** [code-sena/trans-sl-docs](https://github.com/code-sena/trans-sl-docs)

---

## ¿Qué hace?

- **Traducción en tiempo real** — detecta las manos con la cámara y clasifica señas estáticas y gestos en movimiento, mostrando el resultado como texto y reproduciéndolo por voz.
- **Abecedario LSC** — módulo de aprendizaje con las señas del alfabeto.
- **Historial** — guarda y consulta las traducciones realizadas.
- **Estadísticas** — métricas de uso y progreso del usuario.
- **Cuentas de usuario** — registro, inicio de sesión, verificación por código y recuperación de contraseña.
- **Panel de administración** — captura de muestras en el dispositivo, importación/exportación de muestras y sincronización de las plantillas de movimiento con el backend (`/api/sign-templates`). Las muestras no se suben al servidor y no hay entrenamiento de modelo desde la app.
- **Multi-idioma** — interfaz en español, inglés, francés y portugués.
- **Tema claro / oscuro** — con detección automática de la preferencia del sistema.

---

## Stack tecnológico

| Área | Tecnología |
|---|---|
| Framework | Expo `~57` · React Native `0.86` · React `19.2` · react-native-web `0.21` |
| Lenguaje | TypeScript `~6.0` |
| Navegación | React Navigation 6 (stacks + bottom tabs) |
| Visión por computador | MediaPipe Tasks Vision `0.10.14` · TensorFlow.js `4` (modelo de palabras) · clasificadores KNN y DTW propios |
| Pruebas | Jest + `jest-expo` |
| Voz | `expo-speech` |
| Cámara y media | `expo-camera` · `expo-image-picker` |
| Almacenamiento | AsyncStorage · `expo-secure-store` |
| HTTP | Axios |
| Web / despliegue | Metro (bundler web) · Docker · Nginx |

---

## Arquitectura

El proyecto sigue una organización **por features (screaming architecture)**:

```
src/
├── app/                 # Núcleo de la aplicación
│   ├── config/          # Configuración de API e i18n (es · en · fr · pt)
│   ├── providers/       # Contextos globales: Auth, Theme, Language
│   └── routes/          # Navegadores y definición de rutas
│
├── feature/             # Cada dominio funcional, aislado
│   ├── Admin/           # Dashboard y entrenamiento del modelo
│   ├── Alphabet/        # Abecedario LSC
│   ├── auth/            # Login, registro, recuperación de contraseña
│   ├── History/         # Historial de traducciones
│   ├── homescreen/      # Landing pública y demos
│   ├── Profile/         # Perfil, términos y política de privacidad
│   ├── Stats/           # Estadísticas de uso
│   └── Translation/     # Traducción en vivo + pipeline de visión
│
├── shared/              # Reutilizable entre features
│   ├── components/      # Botones, inputs, cards, headers, footers...
│   ├── constants/       # Colores, temas y estilos
│   ├── hooks/           # Hooks genéricos
│   ├── types/           # Tipos compartidos
│   └── utils/           # Utilidades
│
├── assets/              # Imágenes, iconos y fuentes
└── web/                 # Recursos específicos de la versión web
```

Cada feature agrupa sus propias `pages/`, `components/`, `hooks/` y `services/`, de modo que se puede entender y modificar de forma independiente.

### Pipeline de visión

El reconocimiento vive en `src/feature/Translation/services/vision/` y está desacoplado detrás de una interfaz común (`SignVisionProvider`), lo que permite intercambiar el motor de detección:

- **`mediapipeProvider`** — proveedor principal, con implementación nativa y web.
- **`tfjsProvider`** — inferencia con TensorFlow.js.
- **`mockProvider`** — datos simulados para desarrollo y pruebas sin cámara.

La traducción tiene dos motores:

- **Palabras** (por defecto) — modelo TensorFlow.js propio de 54 señas LSC en `public/models/lsc/`, alimentado con los landmarks de manos y pose (`wordEngine`). En Android e iOS corre dentro de un WebView.
- **Abecedario** — sobre los landmarks de la mano se aplican normalización, un **clasificador KNN** para señas estáticas y un **clasificador de movimiento** (DTW) basado en plantillas de secuencias para señas dinámicas.

---

## Requisitos previos

- **Node.js 20** o superior
- **npm**
- App **Expo Go** (para probar en un dispositivo físico) o un emulador de Android / simulador de iOS
- Un backend expuesto en `/api`. Por defecto la app usa el de producción (`https://traducesenas.tech/api`); para usar el [backend](https://github.com/mauro-1508/backendTS) local, crea un `.env` con `EXPO_PUBLIC_API_URL=http://localhost:8080/api` y reinicia Expo. El resto de variables `EXPO_PUBLIC_*` (Google, Facebook, APK) están explicadas en `src/app/config/api.config.ts`

---

## Instalación y ejecución

```bash
# 1. Clonar el repositorio y situarse en la rama de desarrollo
git clone https://github.com/tadeo77789/frontendTS.git
cd frontendTS
git checkout develop

# 2. Instalar dependencias
npm install

# 3. Levantar la aplicación
npm start
```

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo de Expo |
| `npm run android` | Ejecuta la app en un emulador o dispositivo Android |
| `npm run ios` | Ejecuta la app en un simulador de iOS |
| `npm run web` | Ejecuta la app en el navegador |
| `npm test` | Ejecuta las pruebas (Jest) |
| `npm run typecheck` | Revisa los tipos con TypeScript |

---

## Despliegue web con Docker

El repositorio incluye un `Dockerfile` multietapa que compila la versión web con Expo y la sirve mediante Nginx:

```bash
docker build -t traduce-senas .
docker run -p 8080:80 traduce-senas
```

La aplicación queda disponible en `http://localhost:8080`.

---

## Ramas del repositorio

| Rama | Contenido |
|---|---|
| `main` | Versión publicada en producción; cada versión lleva su tag (`vX.Y.Z`) y su Release |
| `develop` | Integración del trabajo en curso |
| `feat/*`, `fix/*`, `chore/*` | Una rama por tarea, con PR hacia `develop` |

El desarrollo se hace en ramas de tarea que se fusionan en **`develop`**; las versiones pasan de `develop` a `main`. La versión de la app es `expo.version` en `app.json`, y `android.versionCode` sube en cada APK.

---

## Equipo

- **Luis Alejandro Duarte Aldana** — [@tadeo77789](https://github.com/tadeo77789)
- **Juan Mauricio Suaza Solórzano** — [@mauro-1508](https://github.com/mauro-1508)
- **Juan Camilo Fierro Esquivel**

Proyecto de formación SENA, ficha ADSO 3145556.


## Reto del día

La pestaña principal de Traducción incorpora `DailyChallengeCard`, con nombre, condición de
traducción guardada y confirmada, progreso accesible, puntos previstos/otorgados y estado.
Respeta tema y ES/EN/FR/PT; maneja carga, error, reintento y ausencia de retos.
Visitantes y usuarios excluidos por `users.manage` no consultan el endpoint privado.
La carga espera a resolver permisos y deniega consultas si falla esa resolución.

`dailyChallenge.service.ts` usa el cliente con API_BASE_URL y ENDPOINTS.dailyChallenge
(`/profile/challenges/today`), token explícito, AbortSignal y validación del contrato success/data.
El servidor concede el progreso y los puntos; el cliente solo consulta la proyección.

Después de confirmar el guardado HTTP, translationsService emite una señal local exclusivamente
para la sesión de origen vigente. El hook vuelve a consultar a los 0,8/2,5/6/12 segundos desde
el último guardado para tolerar la entrega eventual de TranslationProduced. Otro guardado
reinicia esa ventana; no hay polling continuo. Navegación, cambios de sesión, desmontaje y
logout cancelan peticiones y temporizadores; las respuestas también se verifican por usuario,
token y generación. Recuperar foco o volver del segundo plano consulta de nuevo.
Un temporizador único renueva el día a medianoche de Bogotá; no se muestra el dato de ayer.
Si el evento tarda más de 12 segundos, recuperar foco o reintentar vuelve a consultar.

`AchievementUnlockAlerts` comparte una cola de retos y logros, con un solo lector de
notificaciones cada 20 segundos, como antes. Solo consulta el reto si hay candidatos
o al establecer la referencia inicial; no añade otro temporizador de polling.
Un reto exige `typeCode=CHALLENGE_COMPLETED`, canal IN_APP, estado SENT sin leer,
referencia exacta a la asignación, completed/completedAt persistidos y `reward`.
Muestra el nombre de la instantánea en el idioma actual y `reward.points`, nunca
los puntos del catálogo. La tarjeta también exige recompensa para decir «otorgados».

La fila de avisos se monta antes del navegador y ocupa espacio propio, sin cubrir
cámara, controles ni pestañas. Reutiliza tema, áreas seguras, región accesible,
botón de cierre de 44 puntos y entrada sin animación con movimiento reducido.
Intenta marcar leído a los 250 ms de presentar la tarjeta (entrada: 180 ms); el
cierre previo o invalidación cancela ese intento. Un fallo de acuse no bloquea la UI.

Respeta preferencias y exclusión administrativa. Logout, cambio de token/generación,
desmontaje, segundo plano y reconexiones detectadas vacían la cola; las solicitudes
se cancelan y las respuestas tardías se invalidan. Cada reactivación establece una
referencia nueva con logros ya desbloqueados y el reto ya recompensado, que se
descartan sin marcarlos leídos. No se anuncian retos de días anteriores.

La entrega visual es de mejor esfuerzo: usa hasta 100 notificaciones sin leer por
consulta y memoria de sesión. Puede omitir un aviso en la ventana de referencia,
con entregas posteriores a medianoche o si el candidato queda fuera de esa página.
En web se observan online/offline; en nativo una desconexión se conoce al fallar una
consulta o cambiar AppState. Una caída breve sin señal observable puede pasar
inadvertida. No se garantiza exactamente una vez entre pestañas/dispositivos ni
acuse durable; la campana conserva los avisos no leídos. No se añade push ni sockets.

El frontend solicita `catalogVersion=2&challengeRewards=1`; v2 sin esa capacidad
conserva las 21 reglas para clientes anteriores con validadores cerrados.
El catálogo ampliado acepta DAILY_CHALLENGE_POINTS: medallas por 500/1000/3000 puntos
realmente otorgados por retos diarios, con cero puntos de premio. El backend
inicializa la historia mediante 010 con fecha de reconocimiento al migrar y sin
notificaciones retroactivas. Las lecturas no crean progreso. v1 se mantiene.
Aplicar primero 009/010 y actualizar el backend; después publicar el frontend.

La comprobación visual real en navegador y dispositivo sigue pendiente, incluyendo
cámara activa, fuente grande, lector de pantalla, movimiento reducido, móvil/web,
temas y los cuatro idiomas. Las pruebas simuladas y el build no sustituyen ese recorrido.

Pruebas específicas: dailyChallenge.service.test.ts, useDailyChallenge.test.ts,
DailyChallengeCard.test.tsx y translations.service.test.ts. Usan transporte y plataforma simulados;
no sustituyen PostgreSQL/RabbitMQ ni verificación en navegador/dispositivo real.
Ejecutar `npm run typecheck`, `npm test -- --runInBand` y el build de CI
`npx expo export --platform web --output-dir <directorio-nuevo-de-prueba>` con Node >=20.
