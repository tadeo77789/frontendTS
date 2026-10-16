import { checkEmail, isValidEmail, normalizeEmail } from '../email';

describe('normalizeEmail', () => {
  it('quita espacios y pasa a minúsculas', () => {
    expect(normalizeEmail('  Ana.Perez@Gmail.COM ')).toBe('ana.perez@gmail.com');
  });
});

describe('isValidEmail', () => {
  it.each(['ana@gmail.com', 'a.b+c@sena.edu.co', '  ana@x.io  '])('acepta %s', (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each(['carlos', 'carlos@gmail', 'carlos@gmail.c', '@gmail.com', 'ana @x.com', ''])('rechaza "%s"', (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe('checkEmail', () => {
  it('vacío o solo espacios es required', () => {
    expect(checkEmail('')).toBe('required');
    expect(checkEmail('   ')).toBe('required');
  });

  it('texto sin arroba es notEmail (escribió un usuario)', () => {
    expect(checkEmail('carlos')).toBe('notEmail');
  });

  it('con arroba pero mal formado es invalid', () => {
    expect(checkEmail('carlos@gmail')).toBe('invalid');
  });

  it('correo válido no devuelve problema', () => {
    expect(checkEmail(' ana@gmail.com ')).toBeUndefined();
  });
});
