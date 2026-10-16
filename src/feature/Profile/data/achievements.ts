/** Estadisticas de Recognition (GET /translations/me/stats), sin rachas. */
export interface MyStats {
  totalTranslations: number;
  distinctWords: number;
  activeDays: number;
}