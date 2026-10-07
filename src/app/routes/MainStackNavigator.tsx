
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChangePasswordScreen } from '../../feature/auth/pages/ChangePasswordScreen';
import { MainTabNavigator } from './MainTabNavigator';

export type MainStackParams = {
  MainTabs: undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<MainStackParams>();

export const MainStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </Stack.Navigator>
);
