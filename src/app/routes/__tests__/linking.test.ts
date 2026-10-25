import { getPathFromState, getStateFromPath } from '@react-navigation/native';
import { linking } from '../linking';

const config = linking.config as Parameters<typeof getStateFromPath>[1];

// Nombre de la pantalla mas profunda del estado que arma React Navigation.
const leafName = (path: string): string | undefined => {
  let state: any = getStateFromPath(path, config);
  let route: any;
  while (state) {
    route = state.routes[state.index ?? state.routes.length - 1];
    state = route.state;
  }
  return route?.name;
};

describe('linking', () => {
  it.each([
    ['/', 'Landing'],
    ['/login', 'Login'],
    ['/registro', 'Register'],
    ['/demo/traductor', 'TraductorDemo'],
    ['/traducir', 'Translation'],
    ['/abecedario', 'Alphabet'],
    ['/historial', 'History'],
    ['/estadisticas', 'Stats'],
    ['/admin', 'Dashboard'],
    ['/admin/muestras', 'ModelSamples'],
    ['/perfil', 'ProfileMain'],
    ['/perfil/terminos', 'Terms'],
    ['/seguridad', 'ChangePassword'],
    ['/restablecer', 'NewPassword'],
  ])('%s abre %s', (path, screen) => {
    expect(leafName(path)).toBe(screen);
  });

  it('pone la direccion de la pestaña al navegar', () => {
    const state = {
      routes: [{
        name: 'MainTabs',
        state: { index: 1, routes: [{ name: 'Translation' }, { name: 'Alphabet' }] },
      }],
    };
    expect(getPathFromState(state as any, config)).toBe('/abecedario');
  });

  it('distingue los terminos con y sin sesion', () => {
    const profileTerms = {
      routes: [{
        name: 'MainTabs',
        state: { routes: [{ name: 'Profile', state: { index: 1, routes: [{ name: 'ProfileMain' }, { name: 'Terms' }] } }] },
      }],
    };
    expect(getPathFromState({ routes: [{ name: 'Terms' }] } as any, config)).toBe('/terminos');
    expect(getPathFromState(profileTerms as any, config)).toBe('/perfil/terminos');
  });

  it('solo se activa en la web', () => {
    expect(linking.enabled).toBe(false);
  });
});
