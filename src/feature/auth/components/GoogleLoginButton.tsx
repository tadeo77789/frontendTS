import React from 'react';
import { Pressable, Image, Text, type ImageStyle, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { googleIcon } from '../../../assets/icons/socialIcons';
import { HoverShadowSoft } from '../../../shared/constants/hoverStyles';
import { useTranslation } from '../../../app/config/i18n';
import { showAlert } from '../../../shared/utils/dialogs';
import { isGoogleLoginAvailable, useGoogleLogin } from '../hooks/useGoogleLogin';

interface Props {
  style: StyleProp<ViewStyle>;
  hoverStyle: StyleProp<ViewStyle>;
  iconStyle: StyleProp<ImageStyle>;
  textStyle: StyleProp<TextStyle>;
}

const Button: React.FC<Props & { onPress: () => void; disabled?: boolean }> = ({
  style, hoverStyle, iconStyle, textStyle, onPress, disabled,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel="Google"
    style={({ hovered }: any) => [style, hovered && !disabled && hoverStyle, hovered && !disabled && HoverShadowSoft, disabled && { opacity: 0.6 }]}
  >
    <Image source={googleIcon} style={iconStyle} resizeMode="contain" />
    <Text style={textStyle}>Google</Text>
  </Pressable>
);

const ConfiguredButton: React.FC<Props> = (props) => {
  const { handleGoogleLogin, ready, loading } = useGoogleLogin();
  return <Button {...props} onPress={handleGoogleLogin} disabled={!ready || loading} />;
};

const UnconfiguredButton: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  return <Button {...props} onPress={() => void showAlert({ message: t('loginGoogleNotConfigured'), icon: 'info' })} />;
};

/** Sin client ID de esta plataforma (o en Expo Go) no se monta el hook de Google: lanzaria un error y tumbaria la pantalla. */
export const GoogleLoginButton: React.FC<Props> = (props) =>
  isGoogleLoginAvailable() ? <ConfiguredButton {...props} /> : <UnconfiguredButton {...props} />;
