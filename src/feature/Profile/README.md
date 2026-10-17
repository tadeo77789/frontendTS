# Perfil y logros

## Estadísticas de Recognition

Las estadísticas proceden de `GET /api/translations/me/stats`:

- `totalTranslations`
- `distinctWords`
- `activeDays`

La respuesta no incluye métricas de rachas. `distinctWords` cuenta textos
distintos; no acredita señas aprendidas. `activeDays` cuenta días con actividad;
no mide días consecutivos.

## Logros persistidos de Profile

El catálogo, los nombres, las descripciones, `currentCount`, `targetCount`
y `achievedAt` proceden de `GET /api/achievements`.

La pantalla utiliza el catálogo recibido de Profile. No lo combina con el
catálogo local anterior ni calcula desbloqueos desde Recognition.

`achievedAt !== null` determina el desbloqueo. El porcentaje individual expresa
`currentCount / targetCount`, acotado entre 0 y 100.

El porcentaje global representa la proporción de logros desbloqueados
del catálogo recibido.

## Carga, errores y catálogo vacío

La respuesta de la API se valida antes de utilizarla.

Una respuesta inválida produce un error; no se sustituye por una lista vacía
ni por progreso cero.

Un catálogo vacío válido produce cero logros y porcentaje cero.

La tarjeta distingue carga, error con reintento, catálogo vacío y datos
no disponibles. Durante carga o error no presenta los datos retenidos
como actuales.

La consulta de logros y la consulta de estadísticas tienen estados independientes.

## Presentación e idiomas

Los textos secretos recibidos se muestran sin sustituirlos por etiquetas locales.

La medalla es neutral. No se asignan categorías ni niveles que el servidor
no devuelve.

`iconReference` se conserva en el contrato, pero en esta entrega no se interpreta
como nombre de Ionicon ni se carga como recurso.

Los textos de interfaz existen en español, inglés, francés y portugués.
Los nombres y las descripciones de los logros mantienen el idioma recibido
del servidor.

## Aislamiento por sesión

Las consultas capturan token, usuario y generación de sesión.

El hook cancela las consultas al perder foco, desmontarse, cambiar de sesión
o reintentar. También descarta los resultados, errores y bloques `finally`
de consultas antiguas.

La selección del detalle se vincula a usuario, token y generación de sesión.
Se oculta desde el primer render de una sesión diferente y se limpia
al cambiar de sesión.

## Límites del progreso histórico

El progreso persistido puede diferir del historial de Recognition:

- Profile cuenta eventos procesados.
- Recognition consulta sus traducciones no eliminadas.

Esta integración no reconstruye progreso ni inventa fechas para traducciones
anteriores. Una traducción existente no garantiza que Profile haya procesado
su evento.

No se incorpora recuperación histórica, revocación de logros por borrado
de traducciones ni logros adicionales de vocabulario o rachas.

## Alcance y decisiones pendientes

La documentación del proyecto revisada mantiene RF8 como pendiente de aprobación.
Esta integración utiliza el contrato implementado y no resuelve esa decisión
de producto.

La conexión del modal de eliminación de cuenta no resuelve la limpieza
de datos entre servicios, que sigue siendo un pendiente separado del backend.

## Visibilidad según acceso

Perfil reutiliza `useAdminMode()` de `AccessContext`; no deduce el modo
administrador desde roles u otra regla propia.

- Administrador: no se muestra la tarjeta de logros ni el contador con su
  etiqueta en el encabezado; tampoco se solicita `GET /api/achievements`.
- Acceso cargando o fallido: se deshabilitan esos mismos elementos y la
  consulta, porque todavía no se puede confirmar el perfil de usuario normal.
- Usuario normal con acceso resuelto sin error: conserva la consulta al recibir
  foco, el contador, la tarjeta y sus estados de carga, error y reintento.

`useMyAchievements(enabled = true)` se llama incondicionalmente.
Al deshabilitarlo, oculta datos y errores desde el render, cancela la petición
pendiente mediante `AbortController` y bloquea `reload`, incluidas referencias
retenidas de renders anteriores. Cada cambio de `enabled` renueva la identidad
de consulta: las respuestas tardías se descartan incluso si el transporte ignora
la cancelación o se vuelve a habilitar el hook. Se mantienen las comprobaciones
de usuario, token, generación de sesión y foco.

Este cambio no modifica catálogo, colores, progreso, botón «Ver más»,
estadísticas, preferencias ni datos persistidos.

### Verificación de este cambio

- Comprobación aislada con Node del hook transpilado y ciclo de hooks simulado:
  aprobada para deshabilitación inicial sin petición, bloqueo de `reload`,
  carga de datos del usuario normal, ocultación inmediata de datos y errores,
  cancelación durante una petición, respuesta tardía tras rehabilitar y cambio
  de cuenta. La simulación usa solicitudes controladas; no es un render de React.
  Se ejecutó mediante `node /tmp/check-profile-achievements.cjs` (artefacto temporal).
- Comprobación estática mediante Node: aprobada para la condición compartida de
  tarjeta, contador con etiqueta y consulta, y para los casos admin, acceso
  cargando, acceso fallido y usuario normal. No prueba el render de la pantalla.
- Gestor comprobado: npm 10.8.2 con `package-lock.json` v3; Node 18.20.8.
  Antes de instalar, `npm ls --depth=0 --include=dev` terminó con
  `ELSPROBLEMS`: faltaban Jest, sus tipos, jest-expo, el preset de React Native,
  Testing Library y test-renderer, aunque otras devDependencies sí estaban.
  `npm config get omit` estaba vacío, `production` era `null` y no estaban
  definidas `NODE_ENV`, `NPM_CONFIG_OMIT` ni `NPM_CONFIG_PRODUCTION`.
  Esto demuestra una instalación incompleta; no permite atribuirla con certeza
  a una instalación anterior que hubiera omitido devDependencies.
- `npm ci --include=dev --no-audit --no-fund`: aprobado, 922 paquetes instalados.
  Los SHA-256 de `package.json` y `package-lock.json` permanecieron idénticos
  antes y después; no se actualizaron versiones ni se forzó la instalación.
- Advertencias de instalación: `EBADENGINE` por Node 18.20.8 frente a los
  requisitos de dependencias existentes (React Native 0.86.3 requiere
  `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`; Testing Library 14.1.0 requiere
  `^22.13.0 || >=24`). npm también advirtió del peer React `^19.3.0` de
  react-reconciler 0.34.0 frente a React 19.2.3 del proyecto. Son advertencias
  del entorno y del árbol de dependencias ya bloqueado, no errores introducidos
  por los cambios de visibilidad. No impidieron instalar ni ejecutar los controles.
- `npm run typecheck`: aprobado, salida 0 sin errores.
- `npm test -- --runInBand`: aprobado, salida 0; 9 suites y 84 pruebas aprobadas.
  Esta suite existente no contiene pruebas específicas de visibilidad de Perfil.
- Los fallos de la verificación anterior (`TS2688` por tipos de Jest ausentes y
  `jest: not found`) eran bloqueos de la instalación local y quedaron resueltos.
  No se observaron fallos actuales, anteriores del código ni relacionados con
  este cambio en los controles ejecutados. No fue necesario contrastar contra
  HEAD al no haber fallos que atribuir.
- `git diff --check`: aprobado tras actualizar esta documentación.
- Revisión visual local confirmada por el usuario con cuentas reales, usando
  el proxy temporal local contra la API publicada: el administrador no muestra
  tarjeta ni contador de logros; el usuario normal conserva ambos; al volver
  a administrador no aparecen logros de la cuenta anterior.
  No se comprobó en Network la ausencia de solicitudes de logros.
- Omitidas: pruebas específicas con renderizador React/React Native del cambio
  y verificación visual en dispositivo. Las comprobaciones aisladas y estáticas
  anteriores no sustituyen esas verificaciones ni constituyen pruebas
  automatizadas del render. La revisión visual local no valida de forma
  exhaustiva el backend.
