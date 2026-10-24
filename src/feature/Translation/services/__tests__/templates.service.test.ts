import { deleteWordTemplates, fetchWordTemplates, loadWordTemplates, uploadWordTakes } from '../wordTemplates.service';
import { downloadMotionTemplates, uploadMotionTemplates } from '../signTemplates.service';
import { api } from '../../../../shared/services/api.client';
import { setWordTemplates } from '../vision/wordTemplateMatcher';
import { wordTakeStore } from '../vision/wordTakeStore';
import { exportGesturesJson, importGesturesJson } from '../vision';

jest.mock('../../../../shared/services/api.client', () => ({ api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
jest.mock('../vision/wordTemplateMatcher', () => ({ setWordTemplates: jest.fn() }));
jest.mock('../vision/wordTakeStore', () => ({ wordTakeStore: { getAll: jest.fn(), clear: jest.fn() } }));
jest.mock('../vision', () => ({ exportGesturesJson: jest.fn(), importGesturesJson: jest.fn() }));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;
const del = api.delete as jest.Mock;
const takes = wordTakeStore.getAll as jest.Mock;

const HOLA = { templateId: 1, label: 'hola', features: [[1, 2]] };
const HOLA2 = { templateId: 2, label: 'hola', features: [[3, 4]] };
const CASA = { templateId: 3, label: 'casa', features: [[5, 6]] };

beforeEach(() => jest.clearAllMocks());

describe('plantillas de palabras (kind word)', () => {
  it('fetchWordTemplates filtra por kind y devuelve [] sin datos', async () => {
    get.mockResolvedValueOnce({ data: { data: [HOLA] } }).mockResolvedValueOnce({ data: null });
    await expect(fetchWordTemplates()).resolves.toEqual([HOLA]);
    expect(get).toHaveBeenCalledWith('/sign-templates', { params: { kind: 'word' } });
    await expect(fetchWordTemplates()).resolves.toEqual([]);
  });

  it('loadWordTemplates carga el motor y devuelve las etiquetas sin repetir', async () => {
    get.mockResolvedValueOnce({ data: { data: [HOLA, HOLA2, CASA] } });
    await expect(loadWordTemplates()).resolves.toEqual(['hola', 'casa']);
    expect(setWordTemplates).toHaveBeenCalledWith([
      { label: 'hola', frames: [[1, 2]] }, { label: 'hola', frames: [[3, 4]] }, { label: 'casa', frames: [[5, 6]] },
    ]);
  });

  it('uploadWordTakes sin tomas no llama al servidor', async () => {
    takes.mockResolvedValueOnce([]);
    await expect(uploadWordTakes()).resolves.toBe(0);
    expect(post).not.toHaveBeenCalled();
  });

  it('uploadWordTakes sube las tomas, las borra del dispositivo y recarga', async () => {
    takes.mockResolvedValueOnce([{ label: 'hola', frames: [[1]] }, { label: 'casa', frames: [[2]] }]);
    post.mockResolvedValueOnce({});
    get.mockResolvedValueOnce({ data: { data: [HOLA] } });

    await expect(uploadWordTakes()).resolves.toBe(2);

    expect(post).toHaveBeenCalledWith('/sign-templates', { templates: [
      { label: 'hola', kind: 'word', features: [[1]], source: 'manual' },
      { label: 'casa', kind: 'word', features: [[2]], source: 'manual' },
    ] });
    expect(wordTakeStore.clear).toHaveBeenCalled();
    expect(setWordTemplates).toHaveBeenCalled();
  });

  it('uploadWordTakes: si falla la subida, conserva las tomas', async () => {
    takes.mockResolvedValueOnce([{ label: 'hola', frames: [[1]] }]);
    post.mockRejectedValueOnce(new Error('sin red'));
    await expect(uploadWordTakes()).rejects.toThrow('sin red');
    expect(wordTakeStore.clear).not.toHaveBeenCalled();
  });

  it('uploadWordTakes: si la recarga falla, la subida igual cuenta', async () => {
    takes.mockResolvedValueOnce([{ label: 'hola', frames: [[1]] }]);
    post.mockResolvedValueOnce({});
    get.mockRejectedValueOnce(new Error('caido'));
    await expect(uploadWordTakes()).resolves.toBe(1);
  });

  it('deleteWordTemplates borra solo las plantillas de esa palabra', async () => {
    get.mockResolvedValueOnce({ data: { data: [HOLA, CASA, HOLA2] } }).mockResolvedValueOnce({ data: { data: [CASA] } });
    del.mockResolvedValue({});

    await deleteWordTemplates('hola');

    expect(del.mock.calls).toEqual([['/sign-templates/1'], ['/sign-templates/2']]);
    expect(setWordTemplates).toHaveBeenLastCalledWith([{ label: 'casa', frames: [[5, 6]] }]);
  });
});

describe('plantillas de movimiento (kind motion)', () => {
  it('downloadMotionTemplates sin plantillas no toca el almacenamiento local', async () => {
    get.mockResolvedValueOnce({ data: { data: [] } });
    await expect(downloadMotionTemplates()).resolves.toBe(0);
    expect(importGesturesJson).not.toHaveBeenCalled();
  });

  it('downloadMotionTemplates importa las del servidor con el modo pedido', async () => {
    get.mockResolvedValueOnce({ data: { data: [{ ...HOLA, kind: 'motion' }] } });
    (importGesturesJson as jest.Mock).mockResolvedValueOnce(1);

    await expect(downloadMotionTemplates('merge')).resolves.toBe(1);

    expect(get).toHaveBeenCalledWith('/sign-templates', { params: { kind: 'motion' } });
    const [json, mode] = (importGesturesJson as jest.Mock).mock.calls[0];
    expect(mode).toBe('merge');
    expect(JSON.parse(json)).toMatchObject({ version: 1, gestures: [{ label: 'hola', frames: [[1, 2]] }] });
  });

  it('uploadMotionTemplates sube las grabadas en el dispositivo', async () => {
    (exportGesturesJson as jest.Mock).mockResolvedValueOnce(JSON.stringify({ gestures: [{ label: 'hola', frames: [[1]] }] }));
    post.mockResolvedValueOnce({});
    await expect(uploadMotionTemplates()).resolves.toBe(1);
    expect(post).toHaveBeenCalledWith('/sign-templates', { gestures: [{ label: 'hola', frames: [[1]] }], kind: 'motion', source: 'manual' });
  });

  it('uploadMotionTemplates sin grabaciones no llama al servidor', async () => {
    (exportGesturesJson as jest.Mock).mockResolvedValueOnce(JSON.stringify({ gestures: [] }));
    await expect(uploadMotionTemplates()).resolves.toBe(0);
    expect(post).not.toHaveBeenCalled();
  });
});
