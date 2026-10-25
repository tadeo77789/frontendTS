import { groupHistory } from '../services/groupHistory';
import type { SavedTranslation } from '../../Translation/services/translations.service';

const row = (id: number, text: string, at: string, extra: Partial<SavedTranslation> = {}): SavedTranslation => ({
  translationId: id, userId: 1, inputText: text, outputText: text, type: 'sena_texto',
  confidence: 0.9, source: 'mediapipe', isDeleted: false, createdAt: `2026-10-24T${at}:00.000Z`, ...extra,
});

describe('groupHistory', () => {
  it('junta las palabras seguidas en una sesion y las ordena como se dijeron', () => {
    // La API entrega la mas reciente primero.
    const groups = groupHistory([row(3, 'ESTAS', '10:01'), row(2, 'COMO', '10:00'), row(1, 'HOLA', '09:59')]);

    expect(groups).toHaveLength(1);
    expect(groups[0].phrase).toBe('HOLA COMO ESTAS');
    expect(groups[0].ids).toEqual([3, 2, 1]);
    expect(groups[0].start.toISOString()).toBe('2026-10-24T09:59:00.000Z');
    expect(groups[0].end.toISOString()).toBe('2026-10-24T10:01:00.000Z');
  });

  it('separa las sesiones con mas de 2 minutos entre palabras', () => {
    const groups = groupHistory([row(3, 'GRACIAS', '10:10'), row(2, 'COMO', '10:00'), row(1, 'HOLA', '09:59')]);

    expect(groups.map(g => g.phrase)).toEqual(['GRACIAS', 'HOLA COMO']);
  });

  it('junta las palabras del modelo que llevan espacio', () => {
    const groups = groupHistory([row(2, 'lo siento', '10:01'), row(1, 'hola', '10:00')]);

    expect(groups.map(g => g.phrase)).toEqual(['hola lo siento']);
  });

  it('no junta otros tipos de traduccion', () => {
    const groups = groupHistory([
      row(3, 'HOLA', '10:02'),
      row(2, 'ADIOS', '10:01', { type: 'texto_sena' }),
      row(1, 'HOLA', '10:00'),
    ]);

    expect(groups.map(g => g.phrase)).toEqual(['HOLA', 'ADIOS', 'HOLA']);
  });

  it('no se rompe con una fila sin texto', () => {
    const groups = groupHistory([row(1, '', '10:00', { inputText: null as unknown as string, outputText: null as unknown as string })]);

    expect(groups[0].phrase).toBe('');
  });
});
