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