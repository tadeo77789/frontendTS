/** Solo se emite después de la confirmación HTTP y para la sesión de origen vigente. */
export interface TranslationSaved { userId: number; token: string }
const listeners = new Set<(event: TranslationSaved) => void>();
export const translationSaved = {
  subscribe(listener: (event: TranslationSaved) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  emit(event: TranslationSaved) { listeners.forEach(listener => listener(event)); },
};
