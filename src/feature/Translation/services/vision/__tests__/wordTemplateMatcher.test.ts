import { matchWordTemplate, setWordTemplates, templateConfidence, wordTemplateLabels } from '../wordTemplateMatcher';
import { FEATURE_DIM, SEQ_LEN } from '../featureBuilder';

const seq = (value: number) => Array.from({ length: SEQ_LEN }, () => new Array(FEATURE_DIM).fill(value));

describe('wordTemplateMatcher', () => {
  afterEach(() => setWordTemplates([]));

  it('sin plantillas no devuelve nada', () => {
    expect(matchWordTemplate(seq(0))).toBeNull();
  });

  it('elige la plantilla mas cercana', () => {
    setWordTemplates([
      { label: 'triste', frames: seq(0.1) },
      { label: 'feliz', frames: seq(0.9) },
    ]);
    expect(matchWordTemplate(seq(0.12))?.label).toBe('triste');
    expect(matchWordTemplate(seq(0.8))?.label).toBe('feliz');
  });

  it('descarta plantillas con el formato del motor viejo', () => {
    setWordTemplates([
      { label: 'vieja', frames: Array.from({ length: 16 }, () => new Array(126).fill(0)) },
      { label: ' triste ', frames: seq(0) },
    ]);
    expect(wordTemplateLabels()).toEqual(['triste']);
  });

  it('la confianza en el umbral es 0.7', () => {
    expect(templateConfidence(2.5, 2.5)).toBeCloseTo(0.7);
    expect(templateConfidence(0, 2.5)).toBe(0.95);
  });
});
