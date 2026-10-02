/**
 * Version para iOS/Android: grabar muestras para el modelo solo existe en web,
 * que es donde corre MediaPipe. Metro toma sampleStore.web.ts en web.
 *
 * Las firmas tienen que coincidir con las de la version web aunque aqui no
 * hagan nada: TypeScript resuelve ESTE archivo al comprobar tipos, asi que un
 * parametro de menos aqui sale como error en quien las llama.
 */

export interface Muestra {
  id?: number;
  glosa: string;
  datos: Float32Array;
  creado: string;
}

export const guardarMuestra = async (_glosa: string, _datos: Float32Array): Promise<void> => {};
export const contarPorGlosa = async (): Promise<Record<string, number>> => ({});
export const borrarGlosa = async (_glosa: string): Promise<void> => {};
export const borrarTodo = async (): Promise<void> => {};
export const exportar = async (): Promise<{ indice: string; datos: Blob } | null> => null;
export const descargar = async (): Promise<number> => 0;
