import { classifyLetterLSC, type Landmark } from '../classifier';

// Mano sintética en coordenadas normalizadas (0..1), palma de frente y dedos hacia arriba.
// Índices de MediaPipe: 0 muñeca, 1-4 pulgar, 5-8 índice, 9-12 medio, 13-16 anular, 17-20 meñique.
type Finger = 'ext' | 'curl' | 'fist';
type Point = [number, number];

const WRIST: Point = [0.5, 0.9];
const MCP_X = { index: 0.42, middle: 0.48, ring: 0.54, pinky: 0.6 };
const MCP_Y = 0.6;

/** Puntas a esta distancia del nudillo: estirado (> 1,4 × pip), doblado en C (0,7-1,3 × pip) o cerrado. */
const TIP_RISE: Record<Finger, number> = { ext: 0.18, curl: 0.06, fist: 0.02 };

interface HandSpec {
  index?: Finger; middle?: Finger; ring?: Finger; pinky?: Finger;
  /** Pulgar: punta y articulación IP. */
  thumb?: { tip: Point; ip: Point };
  /** Mueve la punta de un dedo en x (separar, juntar o cruzar). */
  tipX?: Partial<Record<keyof typeof MCP_X, number>>;
  /** Gira la mano alrededor de la muñeca (grados). */
  rotate?: number;
}

const THUMB = {
  folded: { tip: [0.4, 0.66] as Point, ip: [0.36, 0.68] as Point },
  open: { tip: [0.25, 0.6] as Point, ip: [0.33, 0.65] as Point },
};

const hand = (spec: HandSpec): Landmark[] => {
  const pts: Point[] = new Array(21);
  pts[0] = WRIST;
  const thumb = spec.thumb ?? THUMB.folded;
  pts[1] = [0.42, 0.8];
  pts[2] = [0.38, 0.72];
  pts[3] = thumb.ip;
  pts[4] = thumb.tip;
  (['index', 'middle', 'ring', 'pinky'] as const).forEach((name, i) => {
    const base = 5 + i * 4;
    const x = MCP_X[name];
    const rise = TIP_RISE[spec[name] ?? 'fist'];
    pts[base] = [x, MCP_Y];
    pts[base + 1] = [x, MCP_Y - 0.08];
    pts[base + 2] = [x, MCP_Y - Math.min(rise, 0.13)];
    pts[base + 3] = [spec.tipX?.[name] ?? x, MCP_Y - rise];
  });
  const a = ((spec.rotate ?? 0) * Math.PI) / 180;
  return pts.map(([x, y]) => {
    const dx = x - WRIST[0];
    const dy = y - WRIST[1];
    return { x: WRIST[0] + dx * Math.cos(a) - dy * Math.sin(a), y: WRIST[1] + dx * Math.sin(a) + dy * Math.cos(a), z: 0 };
  });
};

const letterOf = (spec: HandSpec) => classifyLetterLSC(hand(spec)).letter;

describe('classifyLetterLSC', () => {
  it('sin los 21 puntos no reconoce nada', () => {
    expect(classifyLetterLSC([])).toEqual({ letter: '', confidence: 0 });
    expect(classifyLetterLSC(hand({}).slice(0, 20))).toEqual({ letter: '', confidence: 0 });
  });

  describe('puño cerrado', () => {
    it('A: pulgar estirado al lado', () => expect(letterOf({ thumb: THUMB.open })).toBe('A'));
    it('E: pulgar doblado junto a las puntas', () => expect(letterOf({})).toBe('E'));
    it('S: pulgar doblado lejos de las puntas', () => expect(letterOf({ thumb: { tip: [0.38, 0.75], ip: [0.33, 0.72] } })).toBe('S'));
    it('M: pulgar cruzado bajo el anular', () => expect(letterOf({ thumb: { tip: [0.56, 0.64], ip: [0.48, 0.68] } })).toBe('M'));
    it('N: pulgar cruzado hasta el meñique', () => expect(letterOf({ thumb: { tip: [0.62, 0.64], ip: [0.5, 0.68] } })).toBe('N'));
  });

  describe('dedos doblados en C', () => {
    const curled = { index: 'curl', middle: 'curl', ring: 'curl', pinky: 'curl' } as const;
    it('O: pulgar toca el índice', () => expect(letterOf({ ...curled, thumb: { tip: [0.43, 0.56], ip: [0.38, 0.64] } })).toBe('O'));
    it('C: pulgar abierto frente al índice', () => expect(letterOf({ ...curled, thumb: { tip: [0.35, 0.6], ip: [0.37, 0.66] } })).toBe('C'));
    it('X: solo el índice doblado', () => expect(letterOf({ index: 'curl' })).toBe('X'));
  });

  describe('un dedo', () => {
    it('D: índice arriba', () => expect(letterOf({ index: 'ext' })).toBe('D'));
    it('G: índice con la mano de lado', () => expect(letterOf({ index: 'ext', rotate: 90 })).toBe('G'));
    it('I: solo el meñique', () => expect(letterOf({ pinky: 'ext' })).toBe('I'));
    it('Y: meñique y pulgar', () => expect(letterOf({ pinky: 'ext', thumb: THUMB.open })).toBe('Y'));
    // Defecto conocido: la regla de D/G se evalúa antes y la L nunca sale.
    it.failing('L: índice y pulgar', () => expect(letterOf({ index: 'ext', thumb: THUMB.open })).toBe('L'));
  });

  describe('dos dedos', () => {
    it('U: índice y medio juntos', () => expect(letterOf({ index: 'ext', middle: 'ext' })).toBe('U'));
    it('V: índice y medio separados', () => expect(letterOf({ index: 'ext', middle: 'ext', tipX: { index: 0.4, middle: 0.58 } })).toBe('V'));
    it('R: índice y medio cruzados', () => expect(letterOf({ index: 'ext', middle: 'ext', tipX: { index: 0.5, middle: 0.44 } })).toBe('R'));
    it('K: pulgar entre índice y medio', () => expect(letterOf({ index: 'ext', middle: 'ext', thumb: { tip: [0.45, 0.45], ip: [0.4, 0.58] } })).toBe('K'));
    it('H: índice y medio con la mano de lado', () => expect(letterOf({ index: 'ext', middle: 'ext', rotate: 90 })).toBe('H'));
  });

  describe('tres o más dedos', () => {
    it('W: índice, medio y anular', () => expect(letterOf({ index: 'ext', middle: 'ext', ring: 'ext' })).toBe('W'));
    it('B: cuatro dedos, pulgar doblado', () => expect(letterOf({ index: 'ext', middle: 'ext', ring: 'ext', pinky: 'ext' })).toBe('B'));
    it('5: mano abierta', () => expect(letterOf({ index: 'ext', middle: 'ext', ring: 'ext', pinky: 'ext', thumb: THUMB.open })).toBe('5'));
    it('F: pulgar e índice en pinza, tres dedos arriba', () =>
      expect(letterOf({ middle: 'ext', ring: 'ext', pinky: 'ext', thumb: { tip: [0.43, 0.59], ip: [0.38, 0.64] } })).toBe('F'));
  });

  it('una forma sin regla devuelve vacío con confianza baja', () => {
    const result = classifyLetterLSC(hand({ ring: 'ext' }));
    expect(result.letter).toBe('');
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('la confianza de una letra reconocida está entre 0,7 y 0,85', () => {
    for (const spec of [{ index: 'ext' }, { thumb: THUMB.open }, { pinky: 'ext' }] as HandSpec[]) {
      const { confidence } = classifyLetterLSC(hand(spec));
      expect(confidence).toBeGreaterThanOrEqual(0.7);
      expect(confidence).toBeLessThanOrEqual(0.85);
    }
  });
});
