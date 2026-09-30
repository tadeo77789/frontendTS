

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../providers/AuthContext';
import { useAccess } from '../providers/AccessContext';
import { useTranslation } from '../config/i18n';
import { AuthNavigator } from './AuthNavigator';
import { MainStackNavigator } from './MainStackNavigator';
import { Colors } from '../../shared/constants/colors';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: accessLoading } = useAccess();
  const { t } = useTranslation();

  if (authLoading || accessLoading) {
    return (
      <View style={styles.loading}>

        <ActivityIndicator
          size="large"
          color={Colors.primary}
          accessibilityRole="progressbar"
          accessibilityLabel={t('loading')}
        />
      </View>
    );
  }

  return (
    <NavigationContainer
      documentTitle={{ formatter: () => 'Traduce Señas' }}
    >
      {isAuthenticated ? <MainStackNavigator /> : <AuthNavigator />}

    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
  },
}); 