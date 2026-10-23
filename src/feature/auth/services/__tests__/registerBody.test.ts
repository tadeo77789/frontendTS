import { buildRegisterBody } from '../auth.service';
import { TERMS_VERSION } from '../../../../app/config/legal.config';

jest.mock('../../../../shared/services/api.client', () => ({ api: { post: jest.fn() } }));

const payload = { nombre: 'Ana', edad: 0, email: 'ana@x.com', password: 'Secreta1!', termino_acept: true };

describe('buildRegisterBody', () => {
  it('envía el consentimiento y la versión de los términos que exige el backend', () => {
    expect(buildRegisterBody(payload)).toEqual({
      name: 'Ana',
      email: 'ana@x.com',
      password: 'Secreta1!',
      acceptedTerms: true,
      termsVersion: TERMS_VERSION,
    });
  });

  it('no envía la edad ni campos que el backend no conoce', () => {
    expect(Object.keys(buildRegisterBody(payload)).sort())
      .toEqual(['acceptedTerms', 'email', 'name', 'password', 'termsVersion']);
  });

  it('usa una versión que cabe en users.terms_version (1 a 20 caracteres)', () => {
    expect(TERMS_VERSION.trim().length).toBeGreaterThan(0);
    expect(TERMS_VERSION.length).toBeLessThanOrEqual(20);
  });
});
