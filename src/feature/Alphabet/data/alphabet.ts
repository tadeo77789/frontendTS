/**
 * Alfabeto dactilologico LSC empaquetado con la app.
 *
 * La fuente de verdad es el dominio lexicon del backend (GET /lexicon/alphabet),
 * pero los 27 modelos 3D y sus miniaturas tambien viajan en el bundle: la
 * pantalla se ve sin conexion y sin esperar a la API. Los modelos salen de
 * `modelado/` (ver su README); si se regeneran hay que copiarlos a
 * `src/assets/alfabeto/` y a `backend/public/lexicon/alfabeto/`.
 *
 * Las descripciones coinciden con la semilla de backend/migrations/003_lexicon.sql.
 */
import type { ImageSourcePropType } from 'react-native';

export interface AlphabetLetter {
  /** Codigo del lexico (`LETTER_A`, `LETTER_NN`): la clase que predice el reconocedor. */
  code: string;
  /** Letra que se muestra (A-Z y Ñ). */
  letter: string;
  /** Nombre del archivo sin extension: la Ñ se guarda como NN. */
  file: string;
  /** true si el modelo trae animacion (G, H, J, Ñ, S, Z); el resto son poses fijas. */
  animated: boolean;
  /** Descripcion de la configuracion de la mano, en español. */
  description: string;
  /** Miniatura de la card: local (require) o URL remota del lexico. */
  thumb: ImageSourcePropType;
  /** Modelo 3D: modulo local (require) o URL remota del lexico. */
  model: number | string;
}

type Entry = [letter: string, file: string, animated: boolean, description: string];

const ENTRIES: Entry[] = [
  ['A', 'A', false, 'Puño cerrado con el pulgar extendido, pegado al costado del índice.'],
  ['B', 'B', false, 'Cuatro dedos extendidos y juntos; el pulgar va guardado, pegado a la palma.'],
  ['C', 'C', false, 'Todos los dedos curvados formando una C abierta, con la mano mirando hacia adentro.'],
  ['D', 'D', false, 'Índice recto hacia arriba; medio, anular y meñique recogidos con el pulgar apoyado contra ellos, formando un óvalo en la base del índice.'],
  ['E', 'E', false, 'Dedos flexionados en garra sobre la palma; el pulgar va guardado debajo de los dedos.'],
  ['F', 'F', false, 'Índice y pulgar extendidos hacia arriba y juntos; el resto de la mano en puño.'],
  ['G', 'G', true, 'Mano horizontal con índice y pulgar extendidos; el índice se flexiona y vuelve a extenderse sin mover la mano.'],
  ['H', 'H', true, 'Mano horizontal con índice y medio extendidos y paralelos; anular y meñique recogidos con el pulgar. Se desplaza un poco en horizontal.'],
  ['I', 'I', false, 'Meñique extendido hacia arriba; el resto de la mano cerrada.'],
  ['J', 'J', true, 'Con la configuración de la I, el meñique traza la curva de la J en el aire.'],
  ['K', 'K', false, 'Mano horizontal mirando hacia adentro: índice extendido, medio en diagonal hacia abajo y el pulgar apoyado entre ambos; anular y meñique recogidos.'],
  ['L', 'L', false, 'Pulgar e índice extendidos en ángulo recto formando una L.'],
  ['M', 'M', false, 'Índice, medio y anular flexionados cubren el pulgar.'],
  ['N', 'N', false, 'Índice y medio flexionados cubren el pulgar.'],
  ['Ñ', 'NN', true, 'Con la configuración de la N, la mano hace un movimiento ondulado corto.'],
  ['O', 'O', false, 'Dedos y pulgar curvados formando un círculo cerrado.'],
  ['P', 'P', false, 'Mano colgando con el índice recto hacia abajo; el medio se une con la punta del pulgar formando un aro a un lado. Anular y meñique recogidos.'],
  ['Q', 'Q', false, 'Los cuatro dedos juntos y semiflexionados, con la punta del pulgar tocando las yemas de índice y medio. Se muestra el dorso de la mano.'],
  ['R', 'R', false, 'Índice y medio extendidos hacia arriba y separados.'],
  ['S', 'S', true, 'Índice extendido hacia arriba trazando una S en el aire.'],
  ['T', 'T', false, 'Medio, anular y meñique juntos y rectos hacia arriba; índice y pulgar se unen por las yemas formando un aro.'],
  ['U', 'U', false, 'Índice y meñique extendidos hacia arriba; medio y anular doblados en la palma, sujetos por el pulgar. Palma al frente.'],
  ['V', 'V', false, 'Como el número 2: índice y medio extendidos y separados en V; el pulgar sujeta anular y meñique.'],
  ['W', 'W', false, 'Como el número 3: índice, medio y anular extendidos y separados; el pulgar sujeta el meñique.'],
  ['X', 'X', false, 'Índice flexionado en forma de gancho; el resto de la mano cerrada.'],
  ['Y', 'Y', false, 'Pulgar y meñique extendidos; índice, medio y anular doblados en la palma. Palma al frente.'],
  ['Z', 'Z', true, 'Índice extendido trazando la letra Z en el aire.'],
];

// Metro necesita los require() escritos literalmente: no se pueden armar con
// el nombre de la letra en tiempo de ejecucion.
const THUMBS: Record<string, ImageSourcePropType> = {
  A: require('../../../assets/alfabeto/thumbs/A.png'),
  B: require('../../../assets/alfabeto/thumbs/B.png'),
  C: require('../../../assets/alfabeto/thumbs/C.png'),
  D: require('../../../assets/alfabeto/thumbs/D.png'),
  E: require('../../../assets/alfabeto/thumbs/E.png'),
  F: require('../../../assets/alfabeto/thumbs/F.png'),
  G: require('../../../assets/alfabeto/thumbs/G.png'),
  H: require('../../../assets/alfabeto/thumbs/H.png'),
  I: require('../../../assets/alfabeto/thumbs/I.png'),
  J: require('../../../assets/alfabeto/thumbs/J.png'),
  K: require('../../../assets/alfabeto/thumbs/K.png'),
  L: require('../../../assets/alfabeto/thumbs/L.png'),
  M: require('../../../assets/alfabeto/thumbs/M.png'),
  N: require('../../../assets/alfabeto/thumbs/N.png'),
  NN: require('../../../assets/alfabeto/thumbs/NN.png'),
  O: require('../../../assets/alfabeto/thumbs/O.png'),
  P: require('../../../assets/alfabeto/thumbs/P.png'),
  Q: require('../../../assets/alfabeto/thumbs/Q.png'),
  R: require('../../../assets/alfabeto/thumbs/R.png'),
  S: require('../../../assets/alfabeto/thumbs/S.png'),
  T: require('../../../assets/alfabeto/thumbs/T.png'),
  U: require('../../../assets/alfabeto/thumbs/U.png'),
  V: require('../../../assets/alfabeto/thumbs/V.png'),
  W: require('../../../assets/alfabeto/thumbs/W.png'),
  X: require('../../../assets/alfabeto/thumbs/X.png'),
  Y: require('../../../assets/alfabeto/thumbs/Y.png'),
  Z: require('../../../assets/alfabeto/thumbs/Z.png'),
};

const MODELS: Record<string, number> = {
  A: require('../../../assets/alfabeto/glb/A.glb'),
  B: require('../../../assets/alfabeto/glb/B.glb'),
  C: require('../../../assets/alfabeto/glb/C.glb'),
  D: require('../../../assets/alfabeto/glb/D.glb'),
  E: require('../../../assets/alfabeto/glb/E.glb'),
  F: require('../../../assets/alfabeto/glb/F.glb'),
  G: require('../../../assets/alfabeto/glb/G.glb'),
  H: require('../../../assets/alfabeto/glb/H.glb'),
  I: require('../../../assets/alfabeto/glb/I.glb'),
  J: require('../../../assets/alfabeto/glb/J.glb'),
  K: require('../../../assets/alfabeto/glb/K.glb'),
  L: require('../../../assets/alfabeto/glb/L.glb'),
  M: require('../../../assets/alfabeto/glb/M.glb'),
  N: require('../../../assets/alfabeto/glb/N.glb'),
  NN: require('../../../assets/alfabeto/glb/NN.glb'),
  O: require('../../../assets/alfabeto/glb/O.glb'),
  P: require('../../../assets/alfabeto/glb/P.glb'),
  Q: require('../../../assets/alfabeto/glb/Q.glb'),
  R: require('../../../assets/alfabeto/glb/R.glb'),
  S: require('../../../assets/alfabeto/glb/S.glb'),
  T: require('../../../assets/alfabeto/glb/T.glb'),
  U: require('../../../assets/alfabeto/glb/U.glb'),
  V: require('../../../assets/alfabeto/glb/V.glb'),
  W: require('../../../assets/alfabeto/glb/W.glb'),
  X: require('../../../assets/alfabeto/glb/X.glb'),
  Y: require('../../../assets/alfabeto/glb/Y.glb'),
  Z: require('../../../assets/alfabeto/glb/Z.glb'),
};

export const LOCAL_ALPHABET: AlphabetLetter[] = ENTRIES.map(([letter, file, animated, description]) => ({
  code: `LETTER_${file}`,
  letter,
  file,
  animated,
  description,
  thumb: THUMBS[file],
  model: MODELS[file],
}));

export const localLetterByCode = (code: string): AlphabetLetter | undefined =>
  LOCAL_ALPHABET.find(l => l.code === code);
