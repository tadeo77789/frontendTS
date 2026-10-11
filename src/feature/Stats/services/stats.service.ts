import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';

export interface TranslationsStats {
  totalTranslations: number;
  activeUsers30d: number;
  /** 7 dias, del mas viejo al mas nuevo. */
  daily: { date: string; count: number }[];
  /** 4 semanas. */
  weekly: { weekStart: string; count: number }[];
  /** 12 meses. */
  monthly: { month: string; count: number }[];
}

export interface UsersStats {
  totalUsers: number;
  activeAccounts: number;
}

export interface SectionVisits {
  section: string;
  visits: number;
}

export interface SectionReport {
  from?: string;
  to?: string;
  sections: SectionVisits[];
}

export interface AdminStats {
  translations: TranslationsStats;
  users: UsersStats;
  sections: SectionReport;
}

/** Secciones que la app registra al entrar (coinciden con el backend). */
export type TrackedSection = 'TRANSLATION' | 'ALPHABET' | 'HISTORY';

/** Ultimos 30 dias calendario, incluyendo hoy, en la zona del backend. */
const getSectionRange = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)!.value;
  const to = `${part('year')}-${part('month')}-${part('day')}`;
  const start = new Date(`${to}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  return { from: start.toISOString().slice(0, 10), to };
};

export const statsService = {
  async getAll(): Promise<AdminStats> {
    const [tr, us, se] = await Promise.all([
      api.get(ENDPOINTS.translationsStats),
      api.get(ENDPOINTS.usersStats),
      api.get(ENDPOINTS.analyticsSectionReport, { params: getSectionRange() }),
    ]);
    return {
      translations: tr.data.data as TranslationsStats,
      users: us.data.data as UsersStats,
      sections: se.data.data as SectionReport,
    };
  },

  /** Fire-and-forget: nunca lanza ni bloquea. */
  trackSectionView(section: TrackedSection): void {
    api
      .post(ENDPOINTS.analyticsEvents, { eventType: 'SECTION_VIEW', section })
      .catch(() => undefined);
  },
};
