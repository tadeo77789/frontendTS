

import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LandingScreen } from '../../feature/homescreen/pages/LandingScreen';
import { NosotrosScreen } from '../../feature/homescreen/pages/NosotrosScreen';
import { TranslatorDemoScreen } from '../../feature/homescreen/pages/TranslatorDemoScreen';
import { AlphabetDemoScreen } from '../../feature/homescreen/pages/AlphabetDemoScreen';
import { LoginScreen } from '../../feature/auth/pages/LoginScreen';
import { RegisterScreen } from '../../feature/auth/pages/RegisterScreen';
import { ForgotPasswordScreen } from '../../feature/auth/pages/ForgotPasswordScreen';
import { ChangePasswordScreen } from '../../feature/auth/pages/ChangePasswordScreen';
import { VerifyCodeScreen } from '../../feature/auth/pages/VerifyCodeScreen';
import { NewPasswordScreen } from '../../feature/auth/pages/NewPasswordScreen';
import { TermsScreen } from '../../feature/Profile/pages/TermsScreen';
import { PrivacyPolicyScreen } from '../../feature/Profile/pages/PrivacyPolicyScreen';

export type AuthStackParams = {
  Landing: undefined;
  Nosotros: undefined;
  TraductorDemo: undefined;
  AlfabetoDemo: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: { fromProfile?: boolean } | undefined;
  ChangePassword: undefined;
  VerifyCode: { fromProfile?: boolean } | undefined;
  NewPassword: { fromProfile?: boolean } | undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParams>();

// Las paginas publicas (Landing, Nosotros, demos) solo existen en web.
// En movil la app arranca directo en Login y no se puede navegar a ellas.
const isWeb = Platform.OS === 'web';

export const AuthNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName={isWeb ? 'Landing' : 'Login'}
  >
    {isWeb && (
      <>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Nosotros" component={NosotrosScreen} />
        <Stack.Screen name="TraductorDemo" component={TranslatorDemoScreen} />
        <Stack.Screen name="AlfabetoDemo" component={AlphabetDemoScreen} />
      </>
    )}
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
    <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
    <Stack.Screen name="Terms" component={TermsScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
  </Stack.Navigator>
);