# services/vision — Agente de reconocimiento de señas

## Dos motores

La pantalla de traducción expone un selector con dos motores independientes:

| Motor | Qué reconoce | Archivos | Plataformas |
|---|---|---|---|
| **Palabras** (por defecto) | 7 gestos pre-entrenados de MediaPipe → palabra completa | `gestureProvider*.ts` + `gestureDictionary.ts` | Solo web |
| **Abecedario** | A–Z de LSC letra por letra, con KNN y señas en movimiento | `mediapipeProvider*.ts` + `classifier.ts` y compañía | Web (completo) · nativo (fallback) |

El resto de este documento describe el motor **Abecedario**; el motor
**Palabras** se documenta al final.

## Arquitectura

El agente expone un único contrato `SignVisionProvider` (`types.ts`) y elige
el provider activo según la plataforma:

| Plataforma | Provider activo | Estrategia |
|---|---|---|
| Web | `mediapipeProvider.web.ts` | MediaPipe Hands (CDN) + clasificador geométrico LSC + KNN sobre plantillas del usuario + clasificador de movimiento (letras dinámicas y gestos de palabra) |
| iOS/Android | `mediapipeProvider.ts` | TFJS + modelo Teachable Machine si está configurado; si no, `mockProvider` |

`index.ts` exporta el provider seleccionado por Metro y los helpers para la
pantalla de entrenamiento (`recordSample`, `getSampleCounts`, `recordGesture`,
`getGestureCounts`, etc.).

## Componentes

| Archivo | Rol |
|---|---|
| `classifier.ts` | Clasificador geométrico sobre los 21 keypoints de MediaPipe. Cubre A-Z LSC estático + número 5 (las letras con movimiento las resuelve `motionClassifier.ts`) |
| `motionClassifier.ts` | Señas con movimiento sobre una ventana temporal de landmarks: J/RR/Z por heurísticas de trayectoria + palabras entrenadas vía DTW contra `motionTemplateStore` |
| `motionTemplateStore.ts` | Persistencia de plantillas de GESTO (secuencias de 16 frames × 63 features) en AsyncStorage. Soporta import/export JSON |
| `knnClassifier.ts` | K-Nearest-Neighbors sobre los vectores normalizados de plantillas guardadas |
| `normalize.ts` | Convierte 21 landmarks → vector de 63 features invariante a posición/escala |
| `templateStore.ts` | Persistencia del dataset KNN en AsyncStorage. Soporta import/export JSON |
| `mediapipeProvider.web.ts` | Provider web (MediaPipe + clasificador + KNN + loop de muestreo ~8 fps para movimiento) |
| `mediapipeProvider.ts` | Provider mobile (TFJS opcional + fallback mock) |
| `tfjsProvider.ts` | Carga un modelo TFJS y clasifica frames (decodifica el JPEG con `jpeg-js`, normaliza a 224×224×3, ejecuta inferencia) |
| `mockProvider.ts` | Provider determinista para demo |

## Cómo activar el reconocimiento real en celular

### 1) Instalar dependencias

```bash
cd app
npm install @tensorflow/tfjs jpeg-js
```

Ambos paquetes son JS puro y compatibles con Expo managed workflow (no
requieren `expo prebuild`).

### 2) Entrenar el modelo en Teachable Machine

1. Ir a https://teachablemachine.withgoogle.com/train/image
2. Crear una clase por cada letra del alfabeto LSC que quieras reconocer.
3. Capturar mínimo ~150 imágenes por clase (mano centrada, fondos variados,
   ilumiación variada). Más datos = mejor precisión.
4. Click en **Train Model** y esperar.
5. **Export Model → Tensorflow.js → Download my model**. Te entrega un zip con:
   - `model.json` (arquitectura)
   - `weights.bin` (pesos)
   - `metadata.json` (incluye las etiquetas en `labels`)

### 3) Hostear los archivos

Subí `model.json` y `weights.bin` a una URL pública accesible desde el
celular. Opciones:

- **Firebase Hosting** (gratis y rápido). Habilitá CORS.
- **GitHub Pages** (commiteás los archivos al repo o a una rama gh-pages).
- **AWS S3** con bucket público.

Crea adicionalmente un `labels.json` con un array de strings en el mismo
orden que las clases del modelo:

```json
["A", "B", "C", "D", "E", "F"]
```

### 4) Configurar URLs en la app

Editar `app/config/api.config.ts`:

```ts
export const TFJS_MODEL_URL = 'https://midominio.com/modelo/model.json';
export const TFJS_LABELS_URL = 'https://midominio.com/modelo/labels.json';
```

Reiniciar Metro y al activar la cámara en celular el provider TFJS tomará
el lugar del mock automáticamente.

## Cómo extender el clasificador geométrico (web)

Agregar nuevos casos en `classifier.ts` siguiendo el patrón existente.
Cada letra LSC tiene una configuración característica de dedos extendidos
+ posición del pulgar — usar los helpers `isFingerExtended`,
`isFingerCurled`, `isThumbAcrossPalm`, `isThumbBetweenIndexMiddle`,
`isHandHorizontal`, `isHandPointingDown`.

## Señas con movimiento (solo web)

El provider web corre un loop interno de muestreo (~8 fps) que lee directo
del `<video>` de la cámara y llena un buffer de trayectoria (~2,2 s) en
`motionClassifier.ts`. Con ese buffer se reconocen:

1. **Letras dinámicas J, RR, Z** — heurísticas de trayectoria sobre la
   forma de mano base que reporta el clasificador estático:
   - J: forma I (meñique) que baja y hace gancho lateral
   - Z: forma D (índice) trazando zigzag con descenso neto
   - RR: forma R + vibración horizontal
2. **Palabras completas** (HOLA, GRACIAS, …) — el usuario las graba en la
   pantalla de entrenamiento (panel "Señas de palabras"); cada toma guarda
   la secuencia del gesto re-muestreada a 16 frames y el matcher DTW la
   compara contra la ventana actual en cada detección.

Mientras la mano se está moviendo (recorrido de muñeca alto), las letras
estáticas se degradan a `low_confidence` para no anexar poses intermedias
del trazo. Las detecciones de movimiento se confirman en 1 frame (el gesto
ocurre una sola vez) y consumen el buffer para no re-dispararse.

En mobile el clasificador de movimiento aún no corre (el provider TFJS
clasifica frames sueltos); queda como mejora futura.

---

# Motor "Palabras" — MediaPipe Gesture Recognizer

Modo por defecto de la pantalla de traducción y objetivo de la demo: el
modelo **pre-entrenado** de Google, sin entrenamiento propio.

## Piezas

| Archivo | Rol |
|---|---|
| `gestureDictionary.ts` | Único punto de configuración del vocabulario: categoría de MediaPipe → palabra en español |
| `gestureProvider.ts` | Contrato `GestureEngine` + stub para iOS/Android (`isSupported: false`) |
| `gestureProvider.web.ts` | Implementación real: carga el modelo y corre el bucle de reconocimiento |
| `hooks/useGestureAgent.ts` | Estabilización, anti-rebote y persistencia de cada seña confirmada |

## Vocabulario

| `categoryName` | Palabra |
|---|---|
| `Open_Palm` | Hola |
| `Thumb_Up` | Bien |
| `Thumb_Down` | Mal |
| `Victory` | Paz |
| `ILoveYou` | Te quiero |
| `Closed_Fist` | Sí |
| `Pointing_Up` | Atención |
| `None` | (se ignora) |

Para cambiar el vocabulario basta editar `gestureDictionary.ts`. Cuando exista
un modelo propio de LSC, se cambia además `GESTURE_MODEL_URL` en
`app/config/api.config.ts` y nada más: ni el provider ni la UI se tocan.

## Cómo funciona

1. `gestureProvider.web.ts` importa `@mediapipe/tasks-vision` desde el CDN en
   runtime (un `import()` literal haría que Metro intentara resolver la URL en
   build time) y crea el `GestureRecognizer` en `runningMode: 'VIDEO'`.

   > **Sobre la dependencia.** `@mediapipe/tasks-vision` **sí** está en
   > `package.json`, pero se usa solo con `import type`: aporta los tipos y fija
   > la versión en el lock, y al borrarse en compilación no entra al bundle
   > (verificado: el bundle web pesa igual con y sin ella). El código que corre
   > se baja del CDN, que es lo que evita tener que servir los `.wasm` desde
   > `node_modules`. **La versión del paquete y la de `MEDIAPIPE_VISION_CDN` en
   > `app/config/api.config.ts` deben coincidir.**
2. El bucle es un `requestAnimationFrame` que lee el `<video>` que monta
   expo-camera y llama `recognizeForVideo`. Se lee el video directo en vez de
   `takePictureAsync` porque la estabilización necesita decenas de frames por
   segundo, no una foto cada 1,5 s.
3. `useGestureAgent` recibe un resultado por frame y **solo confirma** una seña
   cuando se cumple todo:
   - `score >= 0.7`
   - la misma seña se sostiene **10 frames** y **≥ 500 ms**
   - no es una repetición dentro de los **2 s** de enfriamiento
4. Al confirmar, hace `POST /api/translations` con
   `type: 'sena_texto'`, `source: 'mediapipe'`, `inputText` = categoría cruda
   (`Open_Palm`) y `outputText` = palabra (`Hola`).

Sin ese filtro el bucle generaría cientos de POST por segundo.

## Modelo

Por defecto se sirve desde el CDN de Google (~8 MB), para no versionar el
binario:

```
https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task
```

Para trabajar sin internet, descargarlo a `src/web/models/gesture_recognizer.task`
y poner `GESTURE_MODEL_URL = '/models/gesture_recognizer.task'`.

## Limitación en móvil

`@mediapipe/tasks-vision` es una librería **web**. Expo Go no trae binding de
MediaPipe Tasks, así que en iOS/Android `gestureEngine.isSupported` es `false`
y la pantalla muestra el aviso en vez de fallar. Habilitarlo en nativo exige
un dev-client con un módulo nativo de MediaPipe Tasks (Android/iOS), que está
fuera del alcance de esta demo.
