import { evaluatePassword, MAX_PASSWORD_BYTES, passwordByteLength } from '../passwordStrength';

describe('evaluatePassword', () => {
  it('vacía: nivel empty y no cumple el mínimo', () => {
    const result = evaluatePassword('');
    expect(result.level).toBe('empty');
    expect(result.meetsMinimum).toBe(false);
  });

  it('marca cada requisito por separado', () => {
    expect(evaluatePassword('abcdefgh').checks).toEqual({
      length: true, upper: false, lower: true, number: false, special: false,
    });
    expect(evaluatePassword('A1!').checks).toEqual({
      length: false, upper: true, lower: false, number: true, special: true,
    });
  });

  it('corta pero variada es weak', () => {
    expect(evaluatePassword('Ab1!').level).toBe('weak');
  });

  it('larga con solo dos tipos de carácter es weak', () => {
    const result = evaluatePassword('abcdefgh12');
    expect(result.level).toBe('weak');
    expect(result.meetsMinimum).toBe(false);
  });

  it('8+ caracteres y 3 tipos cumple el mínimo: medium', () => {
    const result = evaluatePassword('Abcdefg1');
    expect(result.meetsMinimum).toBe(true);
    expect(result.level).toBe('medium');
  });

  it('4 tipos pero menos de 12 caracteres sigue en medium', () => {
    expect(evaluatePassword('Abcde1!x').level).toBe('medium');
  });

  it('12+ caracteres y 4 tipos es strong', () => {
    expect(evaluatePassword('Abcdefgh1!xy').level).toBe('strong');
  });
});

describe('passwordByteLength', () => {
  it('cuenta bytes UTF-8, no caracteres', () => {
    expect(passwordByteLength('abc')).toBe(3);
    expect(passwordByteLength('ñ')).toBe(2);
    expect(passwordByteLength('€')).toBe(3);
    expect(passwordByteLength('😀')).toBe(4);
  });

  it('detecta cuándo se pasa del límite del servidor', () => {
    expect(passwordByteLength('a'.repeat(MAX_PASSWORD_BYTES))).toBe(72);
    expect(passwordByteLength('ñ'.repeat(37))).toBeGreaterThan(MAX_PASSWORD_BYTES);
  });
});
