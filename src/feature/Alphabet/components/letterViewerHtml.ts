/**
 * Pagina del visor 3D de una letra. La usan las dos variantes de LetterViewer:
 * en web va dentro de un <iframe srcDoc>, en movil dentro de un WebView.
 *
 * Encuadre, luces y exposicion son los de `modelado/visor.html`, que es donde
 * se afinaron los modelos; three.js r128 es la misma version que usa ese visor.
 *
 * Protocolo (JSON por postMessage):
 *   app -> visor: LOAD {url, letter, animated}, REPLAY, RESET_VIEW, THEME {dark}
 *   visor -> app: READY, PROGRESS {progress}, LOADED {letter, animated, duration},
 *                 ANIMATION_END, ERROR {message}
 * Los mensajes que salen llevan `source: 'lsc-viewer'` para que la pagina web
 * los distinga de cualquier otro postMessage.
 */
export const VIEWER_SOURCE = 'lsc-viewer';

export type ViewerInbound =
  | { type: 'LOAD'; url: string; letter: string; animated: boolean }
  | { type: 'REPLAY' }
  | { type: 'RESET_VIEW' }
  | { type: 'THEME'; dark: boolean };

export type ViewerOutbound =
  | { source: typeof VIEWER_SOURCE; type: 'READY' }
  | { source: typeof VIEWER_SOURCE; type: 'PROGRESS'; progress: number }
  | { source: typeof VIEWER_SOURCE; type: 'LOADED'; letter: string; animated: boolean; duration: number }
  | { source: typeof VIEWER_SOURCE; type: 'ANIMATION_END' }
  | { source: typeof VIEWER_SOURCE; type: 'ERROR'; message: string };

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0';

export const buildViewerHtml = (dark: boolean): string => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; touch-action: none; }
  canvas { display: block; width: 100% !important; height: 100% !important; outline: none; }
  #bar { position: absolute; top: 0; left: 0; height: 3px; width: 0; background: #7C3AED;
         border-radius: 0 2px 2px 0; transition: width .2s ease, opacity .3s ease; }
</style>
</head>
<body>
<div id="bar"></div>
<script src="${THREE_CDN}/build/three.min.js"></script>
<script src="${THREE_CDN}/examples/js/loaders/GLTFLoader.js"></script>
<script src="${THREE_CDN}/examples/js/controls/OrbitControls.js"></script>
<script>
(function () {
  'use strict';
  var SOURCE = '${VIEWER_SOURCE}';
  function send(msg) {
    msg.source = SOURCE;
    var text = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else if (window.parent && window.parent !== window) window.parent.postMessage(text, '*');
  }
  if (!window.THREE || !THREE.GLTFLoader) {
    send({ type: 'ERROR', message: 'No se pudo cargar three.js (sin conexion?)' });
    return;
  }

  var bar = document.getElementById('bar');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- escena (valores de modelado/visor.html) ---------- */
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 4 / 3, 0.05, 40);

  var hemi = new THREE.HemisphereLight(0xfff6ee, 0x7d8797, 0.36);
  scene.add(hemi);
  var key = new THREE.DirectionalLight(0xfff0e0, 1.15);
  key.position.set(-1.2, 1.9, 1.6);
  key.target.position.set(-0.05, 0.42, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -0.55; key.shadow.camera.right = 0.55;
  key.shadow.camera.top = 0.85; key.shadow.camera.bottom = -0.15;
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 6;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.012;
  key.shadow.radius = 3;
  scene.add(key);
  scene.add(key.target);
  var rim = new THREE.DirectionalLight(0xffffff, 0.30);
  rim.position.set(2.2, 0.6, -1.4);
  scene.add(rim);
  var fill = new THREE.DirectionalLight(0xdbe8ff, 0.26);
  fill.position.set(2.0, 0.4, 2.0);
  scene.add(fill);

  function applyTheme(dark) {
    // En oscuro el fondo absorbe luz: se sube un poco la exposicion para que
    // la piel no se vea apagada contra el panel.
    renderer.toneMappingExposure = dark ? 0.95 : 0.82;
    hemi.intensity = dark ? 0.46 : 0.36;
  }
  applyTheme(${dark ? 'true' : 'false'});

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.45;
  controls.maxDistance = 2.2;
  controls.minPolarAngle = Math.PI * 0.30;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.minAzimuthAngle = -Math.PI * 0.45;
  controls.maxAzimuthAngle = Math.PI * 0.45;

  // Mismo angulo que modelado/visor.html, un poco mas abierto y bajo: en la
  // app el visor es mas chico y la mano en reposo quedaba cortada abajo.
  var TARGET = new THREE.Vector3(-0.045, 0.385, 0);
  var HOME = new THREE.Vector3(0.20, 0.44, 0.98);
  var ZOOM_OUT = 1.12;

  function homePosition() {
    // El encuadre se afino a 4:3. En un visor angosto (movil vertical) se aleja
    // la camara lo justo para que las dos manos sigan dentro del cuadro.
    var aspect = camera.aspect || 4 / 3;
    var k = ZOOM_OUT * (aspect < 1.2 ? Math.min(1.6, 1.2 / aspect) : 1);
    return TARGET.clone().add(HOME.clone().sub(TARGET).multiplyScalar(k));
  }
  function resetView() {
    camera.position.copy(homePosition());
    controls.target.copy(TARGET);
    controls.update();
  }
  function resize() {
    var w = window.innerWidth || 320;
    var h = window.innerHeight || 240;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', function () { resize(); resetView(); });

  /* ---------- carga ---------- */
  var loader = new THREE.GLTFLoader();
  var cache = {};
  var shown = null, mixer = null, action = null, requested = null;
  var clock = new THREE.Clock();

  function progress(p) {
    bar.style.opacity = '1';
    bar.style.width = Math.max(4, Math.min(100, p)) + '%';
    if (p >= 100) setTimeout(function () { bar.style.opacity = '0'; bar.style.width = '0'; }, 350);
  }

  function playOnce() {
    if (!action) return;
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
  }

  function mount(gltf, req) {
    if (shown) scene.remove(shown);
    if (mixer) { mixer.stopAllAction(); mixer = null; action = null; }
    shown = gltf.scene;
    shown.traverse(function (o) {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
        if (o.material) { o.material.metalness = 0; o.material.needsUpdate = true; }
      }
    });
    scene.add(shown);
    var duration = 0;
    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(shown);
      mixer.addEventListener('finished', function () { send({ type: 'ANIMATION_END' }); });
      action = mixer.clipAction(gltf.animations[0]);
      duration = gltf.animations[0].duration;
      if (!reduceMotion) playOnce();
      else { action.play(); action.paused = true; }
    }
    resetView();
    progress(100);
    send({ type: 'LOADED', letter: req.letter, animated: !!action, duration: duration });
  }

  function load(req) {
    requested = req;
    if (cache[req.url]) { mount(cache[req.url], req); return; }
    progress(5);
    loader.load(req.url, function (gltf) {
      cache[req.url] = gltf;
      // Si mientras bajaba se pidio otra letra, esta queda en cache y no se muestra.
      if (requested === req) mount(gltf, req);
    }, function (e) {
      if (requested === req && e && e.total) progress(Math.round(e.loaded / e.total * 95));
    }, function (err) {
      if (requested !== req) return;
      progress(100);
      send({ type: 'ERROR', message: 'No se pudo cargar el modelo de la letra ' + req.letter });
    });
  }

  /* ---------- mensajes ---------- */
  function onMessage(e) {
    var msg;
    try { msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (_) { return; }
    if (!msg || !msg.type) return;
    if (msg.type === 'LOAD') load(msg);
    else if (msg.type === 'REPLAY') { if (action) { action.paused = false; playOnce(); } }
    else if (msg.type === 'RESET_VIEW') resetView();
    else if (msg.type === 'THEME') applyTheme(!!msg.dark);
  }
  window.addEventListener('message', onMessage);
  document.addEventListener('message', onMessage); // WebView de Android

  /* ---------- bucle ---------- */
  function tick() {
    requestAnimationFrame(tick);
    var dt = clock.getDelta();
    if (mixer) mixer.update(dt);
    controls.update();
    renderer.render(scene, camera);
  }
  resize();
  resetView();
  tick();
  send({ type: 'READY' });
})();
</script>
</body>
</html>`;
