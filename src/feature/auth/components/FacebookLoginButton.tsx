import React from 'react';
import { Pressable, Image, Text, type ImageStyle, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { facebookIcon } from '../../../assets/icons/socialIcons';
import { HoverShadowSoft } from '../../../shared/constants/hoverStyles';
import { FACEBOOK_APP_ID } from '../../../app/config/api.config';
import { useTranslation } from '../../../app/config/i18n';
import { showAlert } from '../../../shared/utils/dialogs';
import { useFacebookLogin } from '../hooks/useFacebookLogin';

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
    accessibilityLabel="Facebook"
    style={({ hovered }: any) => [style, hovered && !disabled && hoverStyle, hovered && !disabled && HoverShadowSoft, disabled && { opacity: 0.6 }]}
  >
    <Image source={facebookIcon} style={iconStyle} resizeMode="contain" />
    <Text style={textStyle}>Facebook</Text>
  </Pressable>
);

const ConfiguredButton: React.FC<Props> = (props) => {
  const { handleFacebookLogin, ready, loading } = useFacebookLogin();
  return <Button {...props} onPress={handleFacebookLogin} disabled={!ready || loading} />;
};

const UnconfiguredButton: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  return <Button {...props} onPress={() => void showAlert({ message: t('loginFacebookNotConfigured'), icon: 'info' })} />;
};

/** Sin App ID no se monta el hook de Facebook (lanzaria un error y tumbaria la pantalla). */
export const FacebookLoginButton: React.FC<Props> = (props) =>
  FACEBOOK_APP_ID ? <ConfiguredButton {...props} /> : <UnconfiguredButton {...props} />;
