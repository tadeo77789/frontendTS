import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
import type { MyAccess } from '../../../shared/types/iam';

// Roles y permisos del usuario autenticado. Solo se usan los datos; los mensajes del servidor no se muestran.
export const getMyAccess = async (): Promise<MyAccess> => {
  const { data } = await api.get(ENDPOINTS.iamMyAccess);
  const d = data?.data;
  return {
    roles: Array.isArray(d?.roles) ? d.roles.filter((r: unknown) => typeof r === 'string') : [],
    permissions: Array.isArray(d?.permissions) ? d.permissions.filter((p: unknown) => typeof p === 'string') : [],
  };
};
