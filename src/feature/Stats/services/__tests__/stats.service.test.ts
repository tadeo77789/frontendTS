import { statsService } from '../stats.service';
import { api } from '../../../../shared/services/api.client';

jest.mock('../../../../shared/services/api.client', () => ({ api: { get: jest.fn(), post: jest.fn() } }));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.useRealTimers());

describe('statsService.getAll', () => {
  it('pide las tres estadisticas y las devuelve juntas', async () => {
    get
      .mockResolvedValueOnce({ data: { data: { totalTranslations: 5 } } })
      .mockResolvedValueOnce({ data: { data: { totalUsers: 2 } } })
      .mockResolvedValueOnce({ data: { data: { sections: [] } } });

    await expect(statsService.getAll()).resolves.toEqual({
      translations: { totalTranslations: 5 },
      users: { totalUsers: 2 },
      sections: { sections: [] },
    });
    expect(get).toHaveBeenCalledWith('/translations/stats');
    expect(get).toHaveBeenCalledWith('/users/stats');
  });

  it('el reporte de secciones cubre los ultimos 30 dias en hora de Bogota', async () => {
    jest.useFakeTimers({ now: new Date('2026-03-01T03:00:00Z') }); // 28 feb, 22:00 en Bogota
    get.mockResolvedValue({ data: { data: {} } });

    await statsService.getAll();

    expect(get).toHaveBeenCalledWith('/analytics/reports/sections', { params: { from: '2026-01-30', to: '2026-02-28' } });
  });

  it('si una estadistica falla, falla todo (la pantalla muestra el error)', async () => {
    get.mockRejectedValueOnce(new Error('caido')).mockResolvedValue({ data: { data: {} } });
    await expect(statsService.getAll()).rejects.toThrow('caido');
  });
});

describe('statsService.trackSectionView', () => {
  it('registra la visita sin esperar ni lanzar aunque falle', async () => {
    post.mockRejectedValueOnce(new Error('sin red'));
    expect(() => statsService.trackSectionView('HISTORY')).not.toThrow();
    expect(post).toHaveBeenCalledWith('/analytics/events', { eventType: 'SECTION_VIEW', section: 'HISTORY' });
    await Promise.resolve();
  });
});
