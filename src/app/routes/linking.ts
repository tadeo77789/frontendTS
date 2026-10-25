import { Platform } from 'react-native';
import type { LinkingOptions } from '@react-navigation/native';

// Direcciones de cada pantalla en la web. Con esto la barra del navegador cambia
// al navegar y el boton "atras" vuelve a la pantalla anterior en vez de salir del
// sitio. AuthNavigator y MainStackNavigator nunca se montan a la vez: si la
// direccion es de una pantalla que no existe en el navegador actual (por ejemplo
// /traducir sin sesion), React Navigation abre la pantalla inicial.
// En Android/iOS queda apagado: la app no usa enlaces profundos.
export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  enabled: Platform.OS === 'web',
  prefixes: [],
  config: {
    screens: {
      // Sin sesion (AuthNavigator)
      Landing: '',
      Nosotros: 'nosotros',
      TraductorDemo: 'demo/traductor',
      AlfabetoDemo: 'demo/abecedario',
      Login: 'login',
      Register: 'registro',
      ForgotPassword: 'recuperar',
      VerifyCode: 'verificar',
      NewPassword: 'restablecer',
      Terms: 'terminos',
      PrivacyPolicy: 'privacidad',

      // Con sesion (MainStackNavigator)
      MainTabs: {
        screens: {
          Translation: 'traducir',
          Alphabet: 'abecedario',
          History: 'historial',
          Stats: 'estadisticas',
          Admin: {
            path: 'admin',
            screens: {
              Dashboard: '',
              Training: 'entrenamiento',
              ModelSamples: 'muestras',
            },
          },
          Profile: {
            path: 'perfil',
            screens: {
              ProfileMain: '',
              Terms: 'terminos',
              PrivacyPolicy: 'privacidad',
            },
          },
        },
      },
      ChangePassword: 'seguridad',
    },
  },
};
