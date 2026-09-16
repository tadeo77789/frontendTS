import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import {
  AuthStepCard,
  useAuthPalette,
} from '../components/AuthStepCard';

import { useAuth } from '../../../app/providers/AuthContext';
import { useColors } from '../../../app/providers/ThemeContext';

export function ChangePasswordScreen() {
  const navigation = useNavigation<any>();

  const { user } = useAuth();
  const themed = useColors();

  const P = useAuthPalette(true, themed);

  const { width } = useWindowDimensions();
  const isPhone = width < 480;

  const [loading, setLoading] = useState(false);

  const profileEmail = user?.email ?? '';

  const handleSendCode = () => {
    if (!profileEmail.trim()) {
      Alert.alert(
        'Error',
        'No se pudo obtener el correo asociado a tu cuenta.'
      );
      return;
    }

    setLoading(true);

    // Simulación del envío del código.
    setTimeout(() => {
      setLoading(false);

      navigation.navigate('VerifyCode', {
        fromProfile: true,
      });
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.root,
        {
          backgroundColor: P.page,
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          isPhone && styles.scrollPhone,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthStepCard
          P={P}
          step={1}
          icon="lock-closed-outline"
          title="Verifica tu identidad"
          subtitle="Enviaremos un código de verificación al correo asociado a tu cuenta."
          onBack={() => navigation.goBack()}
        >
          <View
            style={[
              styles.profileEmailBox,
              {
                backgroundColor: P.field,
                borderColor: P.border,
              },
            ]}
          >
            <View
              style={[
                styles.profileIconBox,
                {
                  backgroundColor: P.iconBg,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={22}
                color={P.accent}
              />
            </View>

            <View style={styles.profileEmailContent}>
              <Text
                style={[
                  styles.profileEmailLabel,
                  {
                    color: P.sub,
                  },
                ]}
              >
                Correo asociado a tu cuenta
              </Text>

              <Text
                style={[
                  styles.profileEmailText,
                  {
                    color: P.ink,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {profileEmail}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: P.accent,
              },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSendCode}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </Text>
          </TouchableOpacity>
        </AuthStepCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 88,
  },

  scrollPhone: {
    padding: 16,
    paddingTop: 16,
    justifyContent: 'flex-start',
  },

  profileEmailBox: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 4,
  },

  profileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  profileEmailContent: {
    flex: 1,
  },

  profileEmailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },

  profileEmailText: {
    fontSize: 16,
    fontWeight: '600',
  },

  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});