import { knnClassify } from '../knnClassifier';
import { templateStore, type SignTemplate } from '../templateStore';

jest.mock('../templateStore', () => ({ templateStore: { getAll: jest.fn() } }));

const getAll = templateStore.getAll as jest.MockedFunction<typeof templateStore.getAll>;

const tpl = (label: string, features: number[]): SignTemplate => ({
  label, features, createdAt: '2026-10-16T00:00:00.000Z',
});

const vec = (...values: number[]) => Float32Array.from(values);

describe('knnClassify', () => {
  it('sin plantillas no clasifica', async () => {
    getAll.mockResolvedValue([]);
    expect(await knnClassify(vec(0, 0))).toEqual({ letter: '', confidence: 0, used: false });
  });

  it('ignora plantillas de otra longitud (por ejemplo, de una mano contra dos)', async () => {
    getAll.mockResolvedValue([tpl('A', [0, 0, 0])]);
    expect(await knnClassify(vec(0, 0))).toEqual({ letter: '', confidence: 0, used: false });
  });

  it('si la más cercana está demasiado lejos no da letra', async () => {
    getAll.mockResolvedValue([tpl('A', [5, 5])]);
    expect(await knnClassify(vec(0, 0))).toEqual({ letter: '', confidence: 0.2, used: true });
  });

  it('elige la letra de los vecinos más cercanos', async () => {
    getAll.mockResolvedValue([
      tpl('A', [0.1, 0]), tpl('A', [0, 0.1]), tpl('B', [0.9, 0.9]), tpl('B', [1, 1]),
    ]);
    const result = await knnClassify(vec(0, 0));
    expect(result.letter).toBe('A');
    expect(result.used).toBe(true);
  });

  it('pesa los votos por cercanía: un vecino muy cerca gana a dos lejanos', async () => {
    getAll.mockResolvedValue([tpl('A', [0.01, 0]), tpl('B', [0.8, 0]), tpl('B', [0, 0.8])]);
    expect((await knnClassify(vec(0, 0))).letter).toBe('A');
  });

  it('la confianza sube cuanto más cerca está y nunca pasa de 0.98', async () => {
    getAll.mockResolvedValue([tpl('A', [0, 0])]);
    const exact = await knnClassify(vec(0, 0));
    getAll.mockResolvedValue([tpl('A', [0.6, 0])]);
    const far = await knnClassify(vec(0, 0));

    expect(exact.confidence).toBeLessThanOrEqual(0.98);
    expect(exact.confidence).toBeGreaterThan(far.confidence);
  });
});
