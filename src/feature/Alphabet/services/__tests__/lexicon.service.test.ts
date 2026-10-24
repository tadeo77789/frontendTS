import { fetchAlphabet, getSign, listSigns, mergeAlphabet, searchSigns, type LexiconSign } from '../lexicon.service';
import { LOCAL_ALPHABET, localLetterByCode } from '../../data/alphabet';
import { api } from '../../../../shared/services/api.client';

jest.mock('../../../../shared/services/api.client', () => ({ api: { get: jest.fn() } }));

const get = api.get as jest.Mock;

const sign = (over: Partial<LexiconSign>): LexiconSign => ({
  lexiconId: 1, code: 'LETTER_A', word: 'A', type: 'LETTER', letter: 'A', language: 'LSC', category: null,
  description: null, animated: false, displayOrder: 1, status: 'ACTIVE', resources: [], ...over,
});

beforeEach(() => jest.clearAllMocks());

describe('mergeAlphabet', () => {
  it('una letra que la app ya trae usa los medios locales y el texto del servidor', () => {
    const [a] = mergeAlphabet([sign({ code: 'LETTER_A', description: 'Del servidor', animated: true })]);
    const local = localLetterByCode('LETTER_A')!;
    expect(a).toMatchObject({ code: 'LETTER_A', letter: 'A', description: 'Del servidor', animated: true });
    expect(a.model).toBe(local.model);
    expect(a.thumb).toBe(local.thumb);
  });

  it('sin descripcion del servidor usa la local', () => {
    const [a] = mergeAlphabet([sign({ code: 'LETTER_A', description: null })]);
    expect(a.description).toBe(localLetterByCode('LETTER_A')!.description);
  });

  it('una letra nueva usa las URL remotas del modelo y la miniatura', () => {
    const [n] = mergeAlphabet([sign({
      code: 'LETTER_NUEVA', letter: 'Ñ',
      resources: [
        { resourceId: 1, type: 'MODEL_3D', url: 'https://x/m.glb', mimeType: null, displayOrder: 1, description: null },
        { resourceId: 2, type: 'IMAGE', url: 'https://x/t.png', mimeType: null, displayOrder: 2, description: null },
      ],
    })]);
    expect(n).toMatchObject({ code: 'LETTER_NUEVA', letter: 'Ñ', file: 'NUEVA', model: 'https://x/m.glb', thumb: { uri: 'https://x/t.png' }, description: '' });
  });

  it('descarta palabras, letras sin medios y entradas sin letra', () => {
    const merged = mergeAlphabet([
      sign({ code: 'LETTER_A' }),
      sign({ code: 'WORD_HOLA', type: 'WORD', letter: null }),
      sign({ code: 'LETTER_SIN_MEDIOS', letter: 'X' }),
      sign({ code: 'LETTER_B', letter: null }),
    ]);
    expect(merged.map(l => l.code)).toEqual(['LETTER_A']);
  });

  it('si el servidor no trae ninguna letra valida, vuelve al alfabeto local', () => {
    expect(mergeAlphabet([])).toBe(LOCAL_ALPHABET);
    expect(mergeAlphabet([sign({ type: 'WORD' })])).toBe(LOCAL_ALPHABET);
  });
});

describe('cliente de /lexicon', () => {
  it('fetchAlphabet pide el alfabeto y lo une con el local', async () => {
    get.mockResolvedValueOnce({ data: { data: [sign({ code: 'LETTER_B', letter: 'B' })] } });
    const letters = await fetchAlphabet();
    expect(get).toHaveBeenCalledWith('/lexicon/alphabet');
    expect(letters.map(l => l.code)).toEqual(['LETTER_B']);
  });

  it('fetchAlphabet sin datos devuelve el alfabeto local', async () => {
    get.mockResolvedValueOnce({ data: {} });
    await expect(fetchAlphabet()).resolves.toBe(LOCAL_ALPHABET);
  });

  it('listSigns y searchSigns pasan los filtros y devuelven [] si falta data', async () => {
    get.mockResolvedValueOnce({ data: { data: [sign({})] } }).mockResolvedValueOnce({ data: {} });
    await expect(listSigns({ type: 'WORD', q: 'ho' })).resolves.toHaveLength(1);
    expect(get).toHaveBeenLastCalledWith('/lexicon', { params: { type: 'WORD', q: 'ho' } });
    await expect(searchSigns('ho')).resolves.toEqual([]);
    expect(get).toHaveBeenLastCalledWith('/lexicon/search', { params: { q: 'ho' } });
  });

  it('getSign codifica el codigo en la URL', async () => {
    get.mockResolvedValueOnce({ data: { data: sign({ code: 'A/B' }) } });
    await expect(getSign('A/B')).resolves.toMatchObject({ code: 'A/B' });
    expect(get).toHaveBeenCalledWith('/lexicon/A%2FB');
  });
});
