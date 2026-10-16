import type { User } from '../../types';
import { userDisplayName } from '../userDisplayName';

const user = (patch: Partial<User>): User => ({
  id_usuario: 1,
  nombre: '',
  edad: 20,
  email: '',
  tema: false,
  idioma: 'ES',
  termino_acept: true,
  ...patch,
});

describe('userDisplayName', () => {
  it('usa el nombre del registro sin espacios sobrantes', () => {
    expect(userDisplayName(user({ nombre: '  Ana Pérez ', email: 'ana@x.com' }))).toBe('Ana Pérez');
  });

  it('sin nombre usa lo anterior a la arroba del correo', () => {
    expect(userDisplayName(user({ nombre: '   ', email: 'ana.perez@x.com' }))).toBe('ana.perez');
  });

  it('sin nombre ni correo devuelve Usuario', () => {
    expect(userDisplayName(user({}))).toBe('Usuario');
    expect(userDisplayName(null)).toBe('Usuario');
    expect(userDisplayName(undefined)).toBe('Usuario');
  });
});
