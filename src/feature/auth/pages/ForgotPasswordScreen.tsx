import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  AuthStepCard,
  useAuthPalette,
} from '../components/AuthStepCard';

import { useAuth } from '../../../app/providers/AuthContext';
import { useColors } from '../../../app/providers/ThemeContext';
import { isValidEmail } from '../../../shared/utils/email';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { user } = useAuth();
  const themed = useColors();

  const fromProfile = route.params?.fromProfile ?? false;
  const P = useAuthPalette(fromProfile, themed);

  const { width } = useWindowDimensions();
  const isPhone = width < 480;

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const profileEmail = user?.email ?? '';

  const handleConfirm = () => {
    if (fromProfile) {
      if (!profileEmail.trim()) {
        Alert.alert(
          'Error',
          'No se pudo obtener el correo asociado a tu cuenta.'
        );
        return;
      }

      setLoading(true);

      setTimeout(() => {
        setLoading(false);

        navigation.navigate('VerifyCode', {
          fromProfile: true,
        });
      }, 1000);

      return;
    }

    if (!email.trim()) {
      setEmailError('Ingresa tu correo electrónico.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setEmailError('Ingresa un correo electrónico válido.');
      return;
    }

    setEmailError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      navigation.navigate('VerifyCode', {
        fromProfile: false,
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
          title={
            fromProfile
              ? 'Verifica tu identidad'
              : '¿Olvidaste tu contraseña?'
          }
          subtitle={
            fromProfile
              ? 'Enviaremos un código de verificación al correo asociado a tu cuenta.'
              : 'Ingresa tu correo electrónico para recibir un código de verificación.'
          }
          onBack={() => navigation.goBack()}
        >
          {fromProfile ? (
            <>
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
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Enviando...' : 'Enviar código'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.label,
                  {
                    color: P.label,
                  },
                ]}
              >
                Correo electrónico
              </Text>

              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: P.field,
                    borderColor: emailError
                      ? '#D9534F'
                      : P.border,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color={P.accent}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      color: P.ink,
                    },
                    Platform.OS === 'web' &&
                      ({
                        outlineStyle: 'none',
                        outlineWidth: 0,
                      } as any),
                  ]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);

                    if (emailError) {
                      setEmailError('');
                    }
                  }}
                  placeholder="Ingresa tu correo"
                  placeholderTextColor={P.faint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {emailError ? (
                <Text style={styles.errorText}>
                  {emailError}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: P.accent,
                  },
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Enviando...' : 'Enviar código'}
                </Text>
              </TouchableOpacity>
            </>
          )}
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

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
  },

  errorText: {
    color: '#D9534F',
    fontSize: 13,
    marginTop: 6,
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