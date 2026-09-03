
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../../app/routes/AuthNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { AuthStepCard, useAuthPalette } from '../components/AuthStepCard';

const CODE_LENGTH = 6;
type NavigationProps = NativeStackNavigationProp<AuthStackParams>;

export const VerifyCodeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const fromProfile = (route.params as any)?.fromProfile ?? false;
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);
  const themed = useColors();
  const P = useAuthPalette(fromProfile, themed);
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isPhone = width < 480;

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const handleConfirm = () => {
    if (code.join('').length < CODE_LENGTH) { Alert.alert(t('error'), t('verifyErrorIncomplete')); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); navigation.navigate('NewPassword', { fromProfile }); }, 1000);
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: P.page }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, isPhone && styles.scrollPhone]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthStepCard
          P={P}
          step={2}
          icon="shield-checkmark-outline"
          title={t('verifyTitle')}
          subtitle={t('verifySubtitle')}
          onBack={() => navigation.goBack()}
        >
          <View style={styles.otpRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={el => { if (el) inputs.current[i] = el; }}
                style={[
                  styles.otpInput,
                  { backgroundColor: P.field, borderColor: digit ? P.accent : P.border, color: P.ink },
                  { outlineStyle: 'none' } as any,
                ]}
                value={digit}
                onChangeText={text => handleChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <Text style={[styles.resend, { color: P.faint }]}>
            {t('verifyResend')}{' '}
            <Text style={[styles.resendLink, { color: P.accent }]} onPress={() => {}}>{t('verifyResendLink')}</Text>
          </Text>

          <TouchableOpacity activeOpacity={0.9} onPress={handleConfirm} disabled={loading} style={[styles.btnWrap, loading && { opacity: 0.7 }]}>
            <LinearGradient colors={P.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? t('verifyBtnLoading') : t('verifyBtn')}</Text>
              {!loading && <Ionicons name="arrow-forward" size={17} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </AuthStepCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 88 },
  // En movil el boton de volver va en linea dentro de la tarjeta, asi que ya no
  // hace falta reservar espacio arriba.
  scrollPhone: { padding: 16, paddingTop: 16, justifyContent: 'flex-start' },
  otpRow: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  // minWidth: 0 es imprescindible en web: react-native-web no resetea min-width en
  // TextInput (si lo hace en View), asi que el input conserva su ancho intrinseco
  // de ~170px, no encoge, y las 6 casillas se desbordan de la tarjeta.
  otpInput: { flex: 1, minWidth: 0, aspectRatio: 1 / 1.15, borderWidth: 1.5, borderRadius: 12, fontSize: 22, fontWeight: '800', textAlign: 'center', paddingVertical: 0 },
  resend: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  resendLink: { fontWeight: '800' },
  btnWrap: { borderRadius: 12, overflow: 'hidden' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
