import { translationsService } from '../translations.service';
import { api, getCurrentUserId } from '../../../../shared/services/api.client';

jest.mock('../../../../shared/services/api.client', () => ({
  api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
  getCurrentUserId: jest.fn(async () => 7),
}));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;
const del = api.delete as jest.Mock;

const SAVED = {
  translationId: 3, userId: 7, inputText: 'hola', outputText: 'hola', type: 'sena_texto',
  confidence: 0.9, source: 'knn', isDeleted: false, createdAt: '2026-10-23T12:00:00.000Z',
};
const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status, data: {} } });

beforeEach(() => jest.clearAllMocks());

describe('translationsService.save', () => {
  const input = { inputText: 'hola', outputText: 'hola', type: 'sena_texto' as const, mode: 'words' as const, source: 'knn' as const };

  it('envia la traduccion y devuelve la guardada', async () => {
    post.mockResolvedValueOnce({ data: { data: SAVED } });
    await expect(translationsService.save(input)).resolves.toEqual(SAVED);
    expect(post).toHaveBeenCalledWith('/translations', { ...input, user_id: 7, sessionId: undefined }, undefined);
  });

  it('con contexto elegible envia la sesion y el token de esa sesion', async () => {
    post.mockResolvedValueOnce({ data: { data: SAVED } });
    await translationsService.save(input, { token: 'tok', sessionId: 'sesion-1234567890abcd', eligible: true });
    expect(post).toHaveBeenCalledWith(
      '/translations',
      expect.objectContaining({ sessionId: 'sesion-1234567890abcd' }),
      { headers: { Authorization: 'Bearer tok' } },
    );
  });

  it('sin elegibilidad no envia la sesion (no cuenta para los logros)', async () => {
    post.mockResolvedValueOnce({ data: { data: SAVED } });
    await translationsService.save(input, { token: 'tok', sessionId: 'sesion-1234567890abcd', eligible: false });
    expect(post.mock.calls[0][1].sessionId).toBeUndefined();
  });

  it('propaga el error del backend para que la pantalla lo muestre', async () => {
    post.mockRejectedValueOnce(httpError(500));
    await expect(translationsService.save(input)).rejects.toMatchObject({ response: { status: 500 } });
  });
});

describe('translationsService.list', () => {
  it('pide el historial con limite y devuelve las filas', async () => {
    get.mockResolvedValueOnce({ data: { data: [SAVED] } });
    await expect(translationsService.list({ limit: 100 })).resolves.toEqual([SAVED]);
    expect(get).toHaveBeenCalledWith('/translations/history', { params: { user_id: 7, limit: 100 } });
  });

  it('una respuesta sin data se trata como historial vacio', async () => {
    get.mockResolvedValueOnce({ data: {} });
    await expect(translationsService.list()).resolves.toEqual([]);
  });

  it('un fallo de red se propaga (la pantalla muestra error, no historial vacio)', async () => {
    get.mockRejectedValueOnce(Object.assign(new Error('Network Error'), { isAxiosError: true, request: {} }));
    await expect(translationsService.list()).rejects.toThrow('Network Error');
  });
});

describe('translationsService.remove', () => {
  it('borra por id', async () => {
    del.mockResolvedValueOnce({ data: { success: true } });
    await expect(translationsService.remove(3)).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledWith('/translations/3', { params: { user_id: 7 } });
  });

  it('una traduccion que no existe (404) propaga el error', async () => {
    del.mockRejectedValueOnce(httpError(404));
    await expect(translationsService.remove(99)).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('sin usuario guardado igual llama (el backend toma el usuario del token)', async () => {
    (getCurrentUserId as jest.Mock).mockResolvedValueOnce(null);
    del.mockResolvedValueOnce({ data: { success: true } });
    await translationsService.remove(3);
    expect(del).toHaveBeenCalledWith('/translations/3', { params: { user_id: null } });
  });
});

// La señal local no concede progreso: solicita releer la proyección de Profile.
it('emite refresco solo después de guardar y si la sesión sigue vigente', async () => {
  const { translationSaved } = require('../../../../shared/services/translationSaved');
  const listener=jest.fn();const unsubscribe=translationSaved.subscribe(listener);
  const input={ inputText:'hola',outputText:'hola',type:'sena_texto' as const };
  try {
    post.mockResolvedValue({ data:{ data:SAVED } });
    await translationsService.save(input,{token:'a',sessionId:'session',eligible:true,isCurrent:()=>false});
    expect(listener).not.toHaveBeenCalled();
    await translationsService.save(input,{token:'a',sessionId:'session',eligible:true,isCurrent:()=>true});
    expect(listener).toHaveBeenCalledWith({userId:7,token:'a'});
    post.mockRejectedValueOnce(new Error('network'));
    await expect(translationsService.save(input,{token:'a',sessionId:'session',eligible:true,isCurrent:()=>true})).rejects.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);
  } finally { unsubscribe(); }
});
