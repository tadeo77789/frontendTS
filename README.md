# Traduce Señas

Aplicación multiplataforma que traduce **Lengua de Señas Colombiana (LSC) a texto y voz en tiempo real**, usando la cámara del dispositivo y un modelo de visión por computador que corre directamente en el cliente.

Construida con **Expo + React Native + TypeScript**, funciona desde una sola base de código en **Android, iOS y Web**.

---

## ¿Qué hace?

- **Traducción en tiempo real** — detecta las manos con la cámara y clasifica señas estáticas y gestos en movimiento, mostrando el resultado como texto y reproduciéndolo por voz.
- **Abecedario LSC** — módulo de aprendizaje con las señas del alfabeto.
- **Historial** — guarda y consulta las traducciones realizadas.
- **Estadísticas** — métricas de uso y progreso del usuario.
- **Cuentas de usuario** — registro, inicio de sesión, verificación por código y recuperación de contraseña.
- **Panel de administración** — gestión y entrenamiento del modelo de reconocimiento (captura de muestras, importación/exportación de datos de entrenamiento).
- **Multi-idioma** — interfaz en español, inglés, francés y portugués.
- **Tema claro / oscuro** — con detección automática de la preferencia del sistema.

---

## Stack tecnológico

| Área | Tecnología |
|---|---|
| Framework | Expo `~54` · React Native `0.81` · React `19` |
| Lenguaje | TypeScript `~5.9` |
| Navegación | React Navigation (stacks + bottom tabs) |
| Visión por computador | MediaPipe Hands · TensorFlow.js · clasificador KNN propio |
| Voz | `expo-speech` |
| Cámara y media | `expo-camera` · `expo-av` · `expo-image-picker` |
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

Sobre los puntos de referencia (landmarks) de la mano se aplican normalización, un **clasificador KNN** para señas estáticas y un **clasificador de movimiento** basado en plantillas de secuencias para señas dinámicas.

---

## Requisitos previos

- **Node.js 20** o superior
- **npm**
- App **Expo Go** (para probar en un dispositivo físico) o un emulador de Android / simulador de iOS
- Un backend expuesto en `/api` — la configuración de endpoints está en `src/app/config/api.config.ts`

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
| `main` | Únicamente esta documentación del proyecto |
| `develop` | Código fuente completo de la aplicación |

Todo el desarrollo se realiza sobre **`develop`**.

---

## Autor

**Luis Duarte** — [@tadeo77789](https://github.com/tadeo77789)
