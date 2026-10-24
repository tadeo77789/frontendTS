import { getMyAccess } from '../iam.service';
import { api } from '../../../../shared/services/api.client';

jest.mock('../../../../shared/services/api.client', () => ({ api: { get: jest.fn() } }));

const get = api.get as jest.Mock;

describe('getMyAccess', () => {
  it('devuelve roles y permisos del usuario', async () => {
    get.mockResolvedValueOnce({ data: { data: { roles: ['ADMIN'], permissions: ['users.manage', 'stats.read'] } } });
    await expect(getMyAccess()).resolves.toEqual({ roles: ['ADMIN'], permissions: ['users.manage', 'stats.read'] });
    expect(get).toHaveBeenCalledWith('/iam/me/access');
  });

  it('ignora valores que no son texto y listas ausentes', async () => {
    get.mockResolvedValueOnce({ data: { data: { roles: ['USER', 3, null], permissions: 'stats.read' } } });
    await expect(getMyAccess()).resolves.toEqual({ roles: ['USER'], permissions: [] });
  });

  it('sin data responde sin roles ni permisos', async () => {
    get.mockResolvedValueOnce({ data: undefined });
    await expect(getMyAccess()).resolves.toEqual({ roles: [], permissions: [] });
  });
});
