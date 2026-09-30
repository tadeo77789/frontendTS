/**
 * Plantillas de senas guardadas en el backend.
 *
 * Hasta ahora las plantillas vivian solo en el AsyncStorage del navegador de
 * cada persona. Con esto se bajan del servidor al abrir la traduccion y se
 * pueden subir las grabadas en la app.
 */
import { api } from './api.service';
import { ENDPOINTS } from '../../../app/config/api.config';
import { exportGesturesJson, importGesturesJson } from './vision';

interface ServerTemplate {
  templateId: number;
  label: string;
  kind: 'static' | 'motion';
  features: number[][];
}

/** Baja las plantillas de palabras y las deja en el almacenamiento local. */
export const downloadMotionTemplates = async (mode: 'merge' | 'replace' = 'replace'): Promise<number> => {
  const { data } = await api.get(ENDPOINTS.signTemplates, { params: { kind: 'motion' } });
  const items = (data?.data ?? []) as ServerTemplate[];
  if (items.length === 0) return 0;

  const gestures = items.map(t => ({
    label: t.label,
    frames: t.features,
    createdAt: new Date().toISOString(),
  }));
  return importGesturesJson(JSON.stringify({ version: 1, gestures }), mode);
};

/** Sube al servidor las plantillas de palabras grabadas en este dispositivo. */
export const uploadMotionTemplates = async (): Promise<number> => {
  const json = await exportGesturesJson();
  const { gestures } = JSON.parse(json) as { gestures: { label: string; frames: number[][] }[] };
  if (!gestures?.length) return 0;

  await api.post(ENDPOINTS.signTemplates, { gestures, kind: 'motion', source: 'manual' });
  return gestures.length;
};
