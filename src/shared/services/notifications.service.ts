import { ENDPOINTS } from '../../app/config/api.config';
import { api } from './api.client';

export interface AchievementNotification {
  id: string;
  referenceType: string;
  referenceId: string;
  channel: string;
  readAt?: string;
  status: string;
}

export const notificationsService = {
  // Cada solicitud conserva el token de origen y la cancelación de su sesión.
  async getUnread(token: string, signal: AbortSignal): Promise<AchievementNotification[]> {
    const response = await api.get(ENDPOINTS.notifications, {
      headers: { Authorization: `Bearer ${token}` }, signal,
      params: { unreadOnly: true, limit: 100 },
    });
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },
  async markRead(id: string, token: string, signal: AbortSignal): Promise<void> {
    await api.patch(ENDPOINTS.notificationRead(id), {}, {
      headers: { Authorization: `Bearer ${token}` }, signal,
    });
  },
};
