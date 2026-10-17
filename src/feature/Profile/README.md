# Perfil y catálogo de logros

## Alcance y autoridad

El catálogo original de frontend `d154e1e` contiene 24 logros, ahora persistidos por
`004_achievement_catalog.sql`, con los mismos códigos de presentación, nombres,
requisitos, iconos, niveles y cinco categorías. Los valores de demostración NO se
importan. Los objetivos numéricos antiguos de conjuntos (27, 40, 32) tampoco son
mediciones válidas del contenido completo.

**En esta entrega: 0 nuevos disponibles, 24 próximos y 3 anteriores disponibles.**
No se construyen módulos de práctica, comunidad, aprendizaje ni paquetes offline.
El backend decide disponibilidad y desbloqueos. No existe endpoint nuevo que acepte
contadores o desbloqueos del cliente.

## Contrato de GET /api/achievements

Se conserva la API anterior: sin parámetro o con `catalogVersion=1`, el sobre
`{ data: [...] }` contiene exclusivamente logros anteriores y su formato medido
original, sin campos de catálogo nuevos ni la métrica CATALOG_REQUIREMENT.

El frontend nuevo solicita `GET /api/achievements?catalogVersion=2`. El backend
nuevo responde `{ data: [...], meta: { catalogVersion: 2 } }`. Un backend anterior
ignora el parámetro y devuelve su respuesta anterior válida; no hay reintentos que
transformen errores o datos inválidos en progreso cero. Versiones distintas de
1/2 se rechazan con 400 en el backend nuevo.

En la respuesta v2, cada `achievement` incorpora:


- `collection`: `catalog` (los 24) o `legacy` (los anteriores).
- `availability`: `available` o `upcoming`, independiente de `is_active`.
- `category`: translation/practice/vocabulary/consistency/community; null en anteriores.
- `level`: bronze/silver/gold; null en anteriores.
- `localizations`: es/en/fr/pt con name, description y unavailableReason para próximos.

Disponible: targetCount positivo, currentCount entero >=0 y achievedAt fecha o null.
Próximo: **targetCount=null, currentCount=null, achievedAt=null**; no hay medición.
`achievedAt` sigue siendo autoridad de desbloqueo, incluso si un contador alcanza
la meta. Un secreto pendiente no expone textos localizados.

La métrica nueva `CATALOG_REQUIREMENT` expresa un requisito aún no instrumentado.
La restricción SQL de métricas se amplía en la migración nueva. Por compatibilidad
con target_count NOT NULL >0, las filas próximas almacenan un centinela 1. NO es
una meta ni se expone como progreso; la descripción contiene el requisito exacto.
El cero que producía COALESCE sin una fila de progreso tampoco acredita una
medición nueva. En el borrador, is_active=TRUE permitía que el backend anterior
publicara targetCount=1/currentCount=0 y una métrica desconocida; el frontend
anterior rechazaba la métrica y el nuevo rechazaba su uso como progreso medido.
Ahora esas filas nunca son visibles en v1 y v2 serializa los contadores como null.
Las métricas internas existentes conservan su significado. La proyección filtra
availability=available y el caso de uso vuelve a comprobarlo antes de incrementar.

Ejemplo próximo:

```json
{"achievement":{"code":"hundredSigns","collection":"catalog","availability":"upcoming","metric":"CATALOG_REQUIREMENT","targetCount":null},"currentCount":null,"achievedAt":null}
```

Es un extracto, no una respuesta completa para el validador.

## Catálogo y evidencia pendiente

Todos están **Próximamente** y ninguno acumula progreso en esta entrega.

| # | Código | Requisito | Motivo / evidencia necesaria |
|---|---|---|---|
| 1 | `firstSign` | Primera seña traducida con cámara | Falta un hecho inequívoco de seña confirmada; una fila puede contener un transcript. |
| 2 | `hundredSigns` | 100 señas traducidas | Faltan unidades individuales; contar filas o palabras no acredita señas. |
| 3 | `thousandSigns` | 1000 señas traducidas | Faltan unidades individuales y un acumulado verificable. |
| 4 | `fullConversation` | Traducción continua >5 minutos sin pausas | Faltan intervalos de actividad y definición de pausa. |
| 5 | `voiceOn` | Salida de voz 25 veces | Speech.speak existe; falta definir uso válido y registrar resultado, no clics. |
| 6 | `twoWay` | Voz a señas y señas a texto en la misma sesión | Falta flujo funcional voz→señas y correlación de sesiones. |
| 7 | `offline` | Traducción con paquete offline LSC | Falta paquete identificable y evidencia de ejecución offline. |
| 8 | `firstPractice` | Primera práctica completada con cámara | Faltan prácticas evaluables; las muestras administrativas no son prácticas. |
| 9 | `steadyHand` | 90% de precisión en ronda de 20 señas | Faltan resultados validados; confianza del modelo no es precisión. |
| 10 | `perfectPulse` | 20 señas consecutivas sin error de forma | Faltan evaluación de forma, orden y reglas de ruptura. |
| 11 | `sprinter` | 30 señas reconocidas en menos de un minuto | Falta ronda cronometrada con resultados válidos. |
| 12 | `fingerspelling` | Alfabeto completo sin ayuda visual | Faltan evaluación, registro de ayudas y conjunto versionado. |
| 13 | `honestReview` | Repetir 50 señas antes falladas | Falta historial de errores y vínculo con repeticiones; definir unidades distintas. |
| 14 | `facialExpression` | Aprobar expresión facial | Faltan módulo, rúbrica y aprobación. |
| 15 | `firstTen` | Guardar 10 señas en vocabulario personal | Falta colección personal persistida; definir efecto de quitar y guardar. |
| 16 | `twoHundred` | 200 señas dominadas | Falta criterio y evidencia de dominio; textos distintos no lo acreditan. |
| 17 | `everyday` | Dominar casa, comida y familia completas | Faltan conjunto versionado y dominio por integrante. |
| 18 | `numbersHours` | Dominar cardinales, fechas y horas | Faltan contenido evaluable finito y evidencia de dominio. |
| 19 | `regionalisms` | Guardar 15 variantes regionales conocidas | Faltan relación variante/base/región, conocimiento previo y guardado personal. |
| 20 | `sevenDays` | Practicar 7 días consecutivos | Faltan prácticas válidas y reglas de día local; días activos no son rachas. |
| 21 | `thirtyDays` | Practicar 30 días consecutivos | Faltan prácticas válidas y reglas de día local. |
| 22 | `beforeDawn` | Practicar antes de las 7 diez veces | Faltan prácticas y definición de zona, momento válido y repeticiones diarias. |
| 23 | `sharedSign` | Compartir traducción fuera de la app | Solo existe copia; falta compartir con resultado observable y criterio acordado. |
| 24 | `bridge` | Validar 20 propuestas de la comunidad sorda | Faltan propuestas, procedencia, personas autorizadas y decisiones únicas. |

La evidencia existente se encuentra en Recognition (translations, tipo, origen,
confianza y fecha), TranslationScreen/useGestureAgent, lexicon-service y
analytics-service. TranslationProduced omite tipo, origen y sesión. El transcript
puede contener varias señas; Analytics separa gloss por espacios, lo que tampoco
resuelve la unidad de seña. Los tipos AUDIO_PLAYED o voz_sena por sí solos no
prueban que una acción exista, ocurra o tenga el resultado requerido.

## Conservación y medición anterior

Se mantienen FIRST_TRANSLATION (1), TEN_TRANSLATIONS (10), FIFTY_TRANSLATIONS (50)
con sus UUID, metas, puntos y textos. La migración solo añade columnas con defaults
y filas nuevas mediante ON CONFLICT DO NOTHING: no actualiza filas previas,
user_achievements, achieved_at, notified_at ni notifications.

Su fuente sigue siendo recognition.TranslationProduced, +1 traducción por eventId
con usuario, dentro de la unidad de trabajo y el bloqueo por usuario existentes.
No cuenta señas individuales. Las notificaciones respetan notificationsEnabled.
El contador de cada logro se congela al desbloquearse; no es un total histórico.

Fecha de inicio: el momento en que el consumidor existente comenzó a procesar
los eventos de cada entorno; el repositorio no prueba una fecha de despliegue.
Esta entrega no cambia esa fecha ni reconstruye el pasado. Los 24 nuevos NO tienen
fecha de inicio de medición. Tampoco se infiere historia desde glosas, confianza,
textos distintos, muestras, fechas de desbloqueo o días de traducción.

Limitación heredada: Recognition publica con publishQuietly después de persistir;
una publicación fallida puede dejar una traducción sin reflejar en Profile.
La deduplicación existente es por eventId, no translationId. Esta entrega no cambia
el bus ni reenvía eventos antiguos; no promete reconstrucción exacta del histórico.

## Presentación y acceso

La sección Logros comienza contraída: su encabezado es un botón con flecha, etiqueta traducida y `accessibilityState.expanded`. Al abrirla muestra el contenido completo; cerrarla conserva la expansión de las categorías y cierra el detalle abierto. Cambiar de cuenta contrae la sección y reinicia las categorías. Este estado es solo visual: no altera la habilitación ni las consultas a la API.

Los 24 se conservan agrupados por categoría; inicialmente se muestran las dos primeras medallas de cada una. El nombre y el total siempre permanecen visibles. «Ver más (N)» despliega las restantes y «Ver menos» las contrae de forma independiente, con controles traducidos en los cuatro idiomas y `accessibilityState.expanded`. La expansión se reinicia al cambiar de cuenta o sesión. Los logros anteriores permanecen completos en su sección separada. Próximos: tarjeta/medalla gris,
etiqueta traducida, requisito y explicación; sin contador individual ni barra.
Disponibles pendientes: gris con progreso real. Completados: acento del tema,
con texto explícito de estado. Morado/verde y claro/oscuro usan los colores del
provider. Los anteriores aparecen en un grupo separado, con contador independiente.
El denominador del porcentaje solo incluye nuevos disponibles. Si no hay ninguno,
no hay porcentaje; el resumen distingue catálogo total, disponibles y próximos.

Se reutilizan useAdminMode y el estado de acceso: no hay sección, contador ni
consulta de logros para administradores o mientras el acceso está pendiente/falla.
La consulta y el detalle conservan aislamiento por token, usuario y generación;
se descartan respuestas tardías aunque el transporte ignore AbortController.

## Despliegue compatible y procedimiento real de migración

Profile utiliza scripts SQL manuales. No tiene un runner automático ni un historial
Liquibase propio que aplique 004 al arrancar. El montaje de docker-compose.yml en
/docker-entrypoint-initdb.d solo actúa al inicializar un volumen NUEVO; levantar o
reconstruir contenedores con un volumen existente no aplica la migración.

Sobre una base Profile existente con 001–003 aplicadas, el procedimiento del
proyecto es ejecutar el script con psql desde la raíz del backend:

```sh
docker compose exec -T postgres-profile \
  psql -X -v ON_ERROR_STOP=1 -U postgres -d profile \
  < services/profile-service/db/004_achievement_catalog.sql
```

Utilizar los mismos archivos Compose/opciones de entorno que identifican la
instancia prevista. Este comando de aplicación NO se ha ejecutado sobre ninguna
base real ni sobre el VPS. No recrear volúmenes ni volver a inicializar la base.
El SQL contiene BEGIN/COMMIT; ON_ERROR_STOP hace fallar el comando ante un error.
Reejecutar el mismo 004 es admisible: columnas con IF NOT EXISTS, restricciones
recreadas y filas con ON CONFLICT (code) DO NOTHING. No cambia identidad, metas,
progreso, desbloqueos ni notificaciones anteriores. Un fallo no debe considerarse
una migración aplicada; revisar el error antes de desplegar código dependiente.

La versión corregida de 004 sigue siendo una migración nueva de esta rama,
no una edición de 001–003. No se aplicó el borrador anterior a datos reales.

Orden recomendado, con intervalos independientes:

1. Aplicar 004 mediante el procedimiento anterior. El backend anterior sigue
   leyendo los tres logros actuales: los 24 nuevos se insertan con is_active=FALSE.
2. Desplegar el backend nuevo. Sin parámetro (o con catalogVersion=1) conserva
   exactamente la respuesta anterior. Con catalogVersion=2 publica 24 próximos
   más los tres anteriores, con progreso null para próximos.
3. Desplegar el frontend nuevo, que solicita catalogVersion=2. También puede
   desplegarse ANTES de 004 o del backend: el servidor anterior ignora el parámetro
   y devuelve los tres medidos; el frontend los presenta como anteriores.

La única dependencia de esquema es 004 ANTES del backend nuevo, porque consulta
sus columnas. No se exige simultaneidad con el frontend ni una ventana de error.
Hasta disponer del backend v2, el frontend nuevo recibe solo los tres anteriores;
no completa localmente un catálogo de 24 ni inventa disponibilidad/progreso.

| Base | Backend | Frontend anterior (sin parámetro) | Frontend nuevo (solicita v2) |
|---|---|---|---|
| Antes de 004 | Anterior | 3 medidos | 3 anteriores medidos |
| Con 004 | Anterior | 3 medidos | 3 anteriores medidos |
| Con 004 | Nuevo | 3 medidos, formato v1 | 24 próximos + 3 anteriores |

Rollback de frontend o backend: mantener 004 y sus datos. El backend anterior
sigue ocultando los nuevos por is_active=FALSE, incluso tras volver desde v2.
El frontend anterior sigue usando v1 con el backend nuevo. No hay que borrar ni
revertir filas, UUID, metas, progreso o notificaciones.

La restricción ck_achievement_legacy_publication impide activar is_active en las
filas collection=catalog. Ese campo es la puerta de publicación ANTERIOR, no la
medición v2. La consulta v2 publica explícitamente esa colección y comunica
isActive=true como visibilidad efectiva de esa versión; availability decide si
hay medición. Al activar un logro futuro se mantiene cerrada la puerta v1.

## Activación futura

Por cada logro: acordar su semántica, implementar la acción y evidencia de dominio,
identificadores idempotentes y aislamiento, un evaluador probado y una migración
aditiva que publique métrica/meta reales y disponibilidad. Registrar fecha de
inicio, versión de regla y cobertura del histórico. Disponibilidad no se activa
cambiando solo una etiqueta SQL. No otorgar progreso retroactivo sin evidencia
suficiente ni reinterpretar logros anteriores. Contar prácticas, forma, dominio,
rachas, compartir o validación exige los hechos correspondientes.

## Verificación de compatibilidad

La prueba achievement_catalog.test.ts valida 24 códigos únicos, negociación
v1/v2 y preservación de anteriores. Con PROFILE_TEST_DATABASE_URL crea un esquema
aleatorio en la base exclusiva de pruebas; comprueba reejecución, identidad/metas,
progreso/fechas/notificaciones y procesamiento idempotente de traducciones después
de migrar. Reproduce la consulta del backend anterior con WHERE a.is_active.

Si PROFILE_TEST_PSQL apunta al cliente local, esa prueba aplica 004 DOS veces con
psql -X -v ON_ERROR_STOP=1 --dbname URL -f archivo y PGOPTIONS limitado al esquema
aleatorio. Si no se proporciona cliente, utiliza el mismo SQL desde pg. El helper
verifica 127.0.0.1:55437, base profile_gamification_test y rol gamification_test
antes de escribir; nunca usa DB_* ni carga .env.

Para repetir las pruebas backend afectadas sobre esa instancia exclusiva:

```sh
PROFILE_TEST_DATABASE_URL=postgresql://gamification_test@127.0.0.1:55437/profile_gamification_test \
PROFILE_TEST_PSQL=/ruta/al/psql \
TS_NODE_PROJECT=tsconfig.base.json \
node --require ts-node/register --test --test-concurrency=2 \
  services/profile-service/tests/*.test.ts tests/postgres_schema.test.ts
```

En frontend: npm run typecheck y npm test -- --runInBand (suite COMPLETA).
profileAchievements.service.test.ts comprueba petición v2, respuesta antigua
válida y rechazo de progreso ficticio. Se mantienen pruebas de paletas, detalle,
exclusión administrativa e aislamiento entre cuentas.

Los resultados de la revisión previa sin PostgreSQL son antecedentes. En esta
corrección se ha preparado PostgreSQL 16.15 descargando/extrayendo binarios en
/tmp, sin instalación global ni Docker. Solo se usa un cluster temporal con datos
ficticios y escucha en loopback. No se han consultado datos reales ni el VPS.

### Resultados ejecutados de la corrección de compatibilidad

- PostgreSQL local aislado 16.15: 004 aplicada DOS veces con psql -X
  -v ON_ERROR_STOP=1 -f sobre un esquema aleatorio. Se comprobaron 24 códigos
  únicos, UUID nuevos estables al reejecutar, identidad/metas/progreso/fechas y
  notificaciones de los tres anteriores, lectura anterior/v1/v2 y traducciones
  idempotentes posteriores. Ninguna fila nueva acumuló progreso.
- Todas las pruebas de Profile y postgres_schema: **123 aprobadas, 0 fallidas,
  0 omitidas**, incluidas concurrencia, preferencias y eliminación en PostgreSQL.
- Suite frontend COMPLETA, npm test -- --runInBand: **12 suites, 106 pruebas
  aprobadas**, 0 fallidas. npm run typecheck: aprobado.
- npm run build -w @traduce/profile-service: aprobado. No se repitió el build
  global; la revisión previa identificó google-auth-library ausente en IAM.
- git diff --check: aprobado en ambos repositorios. Sin staging, commits o push.
- No se usaron datos reales, API publicada, proxies ni VPS. No hubo revisión
  visual en navegador/dispositivo. Los paquetes PostgreSQL se descargaron y
  extrajeron en /tmp; no se instalaron dependencias del proyecto ni paquetes globales.

## Estadísticas y consumo

Recognition sigue siendo la fuente de totalTranslations, distinctWords y
activeDays. No se usan para desbloquear logros ni para estimar rachas/dominio.
useMyAchievements valida el sobre completo; una respuesta inválida muestra error,
no catálogo vacío ni progreso cero. Conserva cancelación y generación de sesión.
Los textos de requisito localizados vienen del servidor; las traducciones locales
históricas se alinean con d154e1e y no suministran valores de progreso.
Los iconos del servidor se limitan a la lista de Ionicons del catálogo original;
una referencia desconocida usa ribbon y no carga recursos remotos.

## Antecedente: visibilidad de administradores (PR #43)

El registro siguiente procede de develop y corresponde exclusivamente a la entrega
anterior. Se conserva como antecedente; sus comandos, instalación, pruebas y revisión
visual NO se han repetido en esta ampliación salvo lo declarado en la entrega actual.

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
