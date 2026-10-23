/**
 * Plantillas de palabras agregadas en el admin (kind 'word' en el backend).
 *
 * Viven en el servidor para que las vean todos: la pantalla de traduccion, la
 * web embebida del APK y cualquier navegador. Las tomas recien grabadas
 * esperan en wordTakeStore hasta que el admin pulsa "Subir".
 */
import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
import { setWordTemplates } from './vision/wordTemplateMatcher';
import { wordTakeStore } from './vision/wordTakeStore';

export interface ServerWordTemplate {
  templateId: number;
  label: string;
  features: number[][];
}

/** Lista las plantillas de palabras del servidor. */
export const fetchWordTemplates = async (): Promise<ServerWordTemplate[]> => {
  const { data } = await api.get(ENDPOINTS.signTemplates, { params: { kind: 'word' } });
  return (data?.data ?? []) as ServerWordTemplate[];
};

/**
 * Baja las plantillas y las deja listas para el motor. Devuelve las etiquetas.
 * Si el servidor no responde, el motor sigue solo con el modelo.
 */
export const loadWordTemplates = async (): Promise<string[]> => {
  const items = await fetchWordTemplates();
  setWordTemplates(items.map(t => ({ label: t.label, frames: t.features })));
  return [...new Set(items.map(t => t.label))];
};

/** Sube las tomas pendientes, las borra del dispositivo y recarga el motor. */
export const uploadWordTakes = async (): Promise<number> => {
  const takes = await wordTakeStore.getAll();
  if (takes.length === 0) return 0;

  await api.post(ENDPOINTS.signTemplates, {
    templates: takes.map(t => ({ label: t.label, kind: 'word', features: t.frames, source: 'manual' })),
  });
  await wordTakeStore.clear();
  await loadWordTemplates().catch(() => undefined);
  return takes.length;
};

/** Borra del servidor todas las plantillas de una palabra. */
export const deleteWordTemplates = async (label: string): Promise<void> => {
  const items = await fetchWordTemplates();
  for (const t of items.filter(i => i.label === label)) {
    await api.delete(`${ENDPOINTS.signTemplates}/${t.templateId}`);
  }
  await loadWordTemplates().catch(() => undefined);
};
