/**
 * Sondea el modelo servido en public/models/lsc con entradas que NO son señas,
 * para descubrir su "clase refugio": la que contesta cuando no reconoce nada.
 *
 * Un clasificador de 20 salidas con softmax no puede abstenerse. Ante cualquier
 * cosa que no se parezca a lo que vio reparte 100% entre sus clases, y casi
 * siempre hay una que se lleva todo. Esa clase no aporta informacion y, si no
 * se sabe cual es, inunda la app.
 *
 * Medido el 30/09/2026 sobre el modelo de 20 palabras:
 *
 *     todo ceros (sin manos)   por favor 100.0%
 *     ruido gaussiano          por favor 100.0%
 *     200 entradas al azar     por favor 198 de 200
 *
 * Por eso `por favor` esta en tuning.suppressed (modelWordEngine.web.ts).
 * Volver a correr esto despues de cada entrenamiento:
 *
 *     node scripts/probe-model.js
 */
const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');

const DIR = path.join(process.cwd(), 'public', 'models', 'lsc');

const cargar = async () => {
  const m = JSON.parse(fs.readFileSync(path.join(DIR, 'model.json'), 'utf8'));
  const specs = m.weightsManifest.flatMap(g => g.weights);
  const buffers = m.weightsManifest.flatMap(g => g.paths).map(p => fs.readFileSync(path.join(DIR, p)));
  const total = Buffer.concat(buffers);
  const weightData = total.buffer.slice(total.byteOffset, total.byteOffset + total.byteLength);
  return tf.loadGraphModel(tf.io.fromMemory({
    modelTopology: m.modelTopology,
    weightSpecs: specs,
    weightData,
  }));
};

const top = (probas, glosas, n = 5) =>
  Array.from(probas)
    .map((p, i) => ({ p, w: glosas[i] }))
    .sort((a, b) => b.p - a.p)
    .slice(0, n)
    .map(x => `${x.w} ${(x.p * 100).toFixed(1)}%`)
    .join(' | ');

(async () => {
  const glosas = JSON.parse(fs.readFileSync(path.join(DIR, 'glosas.json'), 'utf8'));
  const modelo = await cargar();

  const correr = async (nombre, hacer) => {
    const datos = new Float32Array(30 * 128);
    hacer(datos);
    const t = tf.tensor(datos, [1, 30, 128]);
    const out = modelo.predict(t);
    const p = await out.data();
    console.log(`${nombre.padEnd(34)} ${top(p, glosas)}`);
    t.dispose();
    out.dispose();
  };

  console.log('\n--- que contesta el modelo ante entradas que NO son señas ---\n');

  await correr('todo ceros (sin manos)', () => {});

  await correr('ruido gaussiano', d => {
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  });

  await correr('manos quietas, presentes', d => {
    for (let f = 0; f < 30; f++) {
      for (let i = 0; i < 63; i++) d[f * 128 + i] = -0.5 + (i % 3) * 0.02;
      for (let i = 63; i < 126; i++) d[f * 128 + i] = 0.5 + (i % 3) * 0.02;
      d[f * 128 + 126] = 1;
      d[f * 128 + 127] = 1;
    }
  });

  await correr('una mano quieta a la derecha', d => {
    for (let f = 0; f < 30; f++) {
      for (let i = 0; i < 63; i++) d[f * 128 + i] = -0.55 + (i % 3) * 0.03;
      d[f * 128 + 126] = 1;
    }
  });

  // 20 entradas al azar: si una clase acapara, es la clase refugio.
  const cuenta = {};
  for (let n = 0; n < 200; n++) {
    const d = new Float32Array(30 * 128);
    for (let f = 0; f < 30; f++) {
      const bx = (Math.random() * 2 - 1) * 0.8;
      const by = (Math.random() * 2 - 1) * 0.8;
      for (let i = 0; i < 21; i++) {
        d[f * 128 + i * 3] = bx + (Math.random() - 0.5) * 0.1;
        d[f * 128 + i * 3 + 1] = by + (Math.random() - 0.5) * 0.1;
        d[f * 128 + i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      }
      d[f * 128 + 126] = 1;
    }
    const t = tf.tensor(d, [1, 30, 128]);
    const out = modelo.predict(t);
    const p = await out.data();
    let mejor = 0;
    for (let i = 1; i < p.length; i++) if (p[i] > p[mejor]) mejor = i;
    cuenta[glosas[mejor]] = (cuenta[glosas[mejor]] || 0) + 1;
    t.dispose();
    out.dispose();
  }

  console.log('\n--- 200 entradas al azar con una mano: que clase acapara ---\n');
  Object.entries(cuenta).sort((a, b) => b[1] - a[1]).forEach(([w, n]) =>
    console.log(`  ${w.padEnd(18)} ${n} de 200  (${(n / 2).toFixed(0)}%)`));
})();
