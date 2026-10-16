

export interface User {
  id_usuario: number;
  nombre: string;
  edad: number;
  email: string;
  tema: boolean;
  idioma: string;
  termino_acept: boolean;
  fecha_terminos?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  edad: number;
  email: string;
  password: string;
  termino_acept: boolean;
}

export type TipoTraduccion = 'texto_sena' | 'sena_texto' | 'voz_sena';

export interface Traduccion {
  id_traduccion: number;
  texto_entrada: string;
  texto_traducido: string;
  tipo: TipoTraduccion;
  fecha_traduccion: string;
  is_deleted: boolean;
}

export type SignAgentStatus =
  | 'idle'
  | 'starting'
  | 'detecting'
  | 'low_confidence'
  | 'no_hands'
  | 'error';

export interface SignDetectionResult {

  text: string;

  confidence: number;

  status: SignAgentStatus;

  timestamp: string;

  features?: number[];

  source?: 'knn' | 'geometric' | 'mock' | 'motion';
}

export type TipoLexico = 'letra' | 'numero' | 'palabra' | 'frase';

export interface LexicoSena {
  id_lexico: number;
  palabras: string;
  tipo: TipoLexico;
  letra?: string;
  idioma: string;
  recursos?: RecursoMultimedia[];
}

export interface RecursoMultimedia {
  id_recurso: number;
  tipo: 'video' | 'imagen' | 'gif';
  url: string;
  mime_type: string;
  orden: number;
}

export interface Notificacion {
  id_notif: number;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  created_at: string;
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
