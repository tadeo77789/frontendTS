
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../../app/routes/AuthNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { AuthStepCard, useAuthPalette } from '../components/AuthStepCard';
import { isValidEmail } from '../../../shared/utils/email';

type NavigationProps = NativeStackNavigationProp<AuthStackParams>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const fromProfile = (route.params as any)?.fromProfile ?? false;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const themed = useColors();
  const P = useAuthPalette(fromProfile, themed);
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isPhone = width < 480;

  const handleConfirm = () => {
    if (!email.trim()) { setEmailError(t('forgotErrorEmpty')); return; }
    if (!email.includes('@')) { setEmailError(t('loginEmailNotUser')); return; }
    if (!isValidEmail(email)) { setEmailError(t('loginEmailInvalid')); return; }
    setEmailError(undefined);
    setLoading(true);
    setTimeout(() => { setLoading(false); navigation.navigate('VerifyCode', { fromProfile }); }, 1000);
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: P.page }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, isPhone && styles.scrollPhone]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthStepCard
          P={P}
          step={1}
          icon="mail-outline"
          title={fromProfile ? t('forgotTitleFromProfile') : t('forgotTitle')}
          subtitle={fromProfile ? t('forgotSubtitleFromProfile') : t('forgotSubtitle')}
          onBack={() => navigation.goBack()}
        >
          <Text style={[styles.label, { color: P.label }]}>{t('forgotEmailLabel')}</Text>
          <View style={[styles.field, { backgroundColor: P.field, borderColor: emailError ? '#F0A9A9' : P.border }]}>
            <Ionicons name="mail-outline" size={19} color={P.accent} />
            <TextInput
              style={[styles.input, { color: P.ink }, { outlineStyle: 'none' } as any]}
              value={email}
              onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(undefined); }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t('forgotEmailPlaceholder')}
              placeholderTextColor="#A6A0B4"
            />
          </View>
          {!!emailError && (
            <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color="#EF4444" /><Text style={styles.errorText}>{emailError}</Text></View>
          )}

          <TouchableOpacity activeOpacity={0.9} onPress={handleConfirm} disabled={loading} style={[styles.btnWrap, loading && { opacity: 0.7 }]}>
            <LinearGradient colors={P.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? t('forgotBtnLoading') : t('forgotBtn')}</Text>
              {!loading && <Ionicons name="send" size={17} color="#fff" />}
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
  scrollPhone: { padding: 40, paddingTop: 16, justifyContent: 'flex-start' },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, height: 52, paddingHorizontal: 16, marginBottom: 16 },
  input: { flex: 1, fontSize: 15 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 12 },
  errorText: { fontSize: 12.5, fontWeight: '700', color: '#EF4444' },
  btnWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
