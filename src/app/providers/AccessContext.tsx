import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useTranslation } from '../config/i18n';
import { getMyAccess } from '../../feature/Admin/services/iam.service';
import { showAlert } from '../../shared/utils/dialogs';
import { normalizeApiError } from '../../shared/services/api.client';
import { PERMISSIONS, type Permission } from '../../shared/types/iam';

interface AccessContextType {
  roles: string[];
  permissions: string[];
  isLoading: boolean;
  error: boolean;
  hasPermission: (p: Permission) => boolean;
  refresh: () => Promise<void>;
}

interface AccessState {
  forToken: string | null; // token para el que se resolvió el acceso (éxito o fallo)
  roles: string[];
  permissions: string[];
  error: boolean;
}

const NONE: string[] = [];
const EMPTY: AccessState = { forToken: null, roles: NONE, permissions: NONE, error: false };

const AccessContext = createContext<AccessContextType | null>(null);

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const [state, setState] = useState<AccessState>(EMPTY);
  const requestId = useRef(0);
  const alerted = useRef(false);

  const load = useCallback(async (forToken: string) => {
    const id = ++requestId.current;
    let next: AccessState;
    let unauthorized = false;
    try {
      const a = await getMyAccess();
      next = { forToken, roles: a.roles, permissions: a.permissions, error: false };
    } catch (e) {
      // Denegar por defecto: sin permisos si el servidor no responde.
      next = { forToken, roles: NONE, permissions: NONE, error: true };
      // Con 401 el interceptor ya avisa "sesión expirada"; no mostrar un segundo aviso.
      unauthorized = normalizeApiError(e).code === 'UNAUTHORIZED';
    }
    if (id !== requestId.current) return; // respuesta obsoleta (logout o nuevo token)
    setState(next);
    if (next.error && !unauthorized && !alerted.current) {
      alerted.current = true;
      showAlert({ message: tRef.current('accessLoadError'), icon: 'warning' });
    }
  }, []);

  // Una sola carga por token (inicio de sesión o rehidratación); se limpia al cerrar sesión.
  useEffect(() => {
    if (isAuthenticated && token) {
      load(token);
    } else {
      requestId.current++;
      alerted.current = false;
      setState(EMPTY);
    }
  }, [isAuthenticated, token, load]);

  const refresh = useCallback(async () => {
    if (token) await load(token);
  }, [token, load]);

  const ready = isAuthenticated && !!token && state.forToken === token;
  const isLoading = isAuthenticated && !!token && !ready;
  const permissions = ready ? state.permissions : NONE;
  const roles = ready ? state.roles : NONE;
  const error = ready && state.error;

  const value = useMemo<AccessContextType>(
    () => ({
      roles,
      permissions,
      isLoading,
      error,
      hasPermission: (p: Permission) => permissions.includes(p),
      refresh,
    }),
    [roles, permissions, isLoading, error, refresh],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
};

export const useAccess = () => {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess debe usarse dentro de AccessProvider');
  return ctx;
};

// Modo admin actual: quien puede gestionar usuarios ve las pestañas de administración.
export const useAdminMode = () => {
  const { hasPermission } = useAccess();
  const canStats = hasPermission(PERMISSIONS.STATS_READ);
  const canAdmin = hasPermission(PERMISSIONS.USERS_MANAGE) || hasPermission(PERMISSIONS.MODELS_MANAGE);
  const adminMode = hasPermission(PERMISSIONS.USERS_MANAGE);
  const homeRoute = adminMode ? (canStats ? 'Stats' : canAdmin ? 'Admin' : 'Profile') : 'Translation';
  return { adminMode, canStats, canAdmin, homeRoute };
};
