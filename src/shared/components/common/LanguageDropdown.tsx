import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LANGUAGE_NAMES, type LanguageCode } from '../../../app/providers/LanguageContext';
import { HoverShadowSoft } from '../../constants/hoverStyles';

const LANG_CODES: LanguageCode[] = ['es', 'en', 'fr', 'pt'];
const LANG_FLAGS: Record<LanguageCode, string> = { es: '🇪🇸', en: '🇺🇸', fr: '🇫🇷', pt: '🇧🇷' };

export interface LanguageDropdownColors {
  surface: string;
  buttonBg: string;
  border: string;
  text: string;
  hint: string;
  primary: string;
  primaryBg: string;
}

interface Props {
  language: LanguageCode;
  onSelect: (code: LanguageCode) => void;
  colors: LanguageDropdownColors;
  disabled?: boolean;
  /** Oculta el nombre del idioma en pantallas estrechas; queda el globo y la flecha. */
  compact?: boolean;
  accessibilityLabel?: string;
}

/**
 * Botón de idioma con menú desplegable. El menú se cierra al elegir, al tocar
 * cualquier parte fuera de él o con Escape (web).
 */
export const LanguageDropdown: React.FC<Props> = ({
  language, onSelect, colors: C, disabled = false, compact = false, accessibilityLabel,
}) => {
  const [open, setOpen] = useState(false);
  const visible = open && !disabled;

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible]);

  return (
    <View style={visible && styles.raised}>
      {/* Capa transparente que cubre la pantalla: tocar fuera del menú lo cierra. */}
      {visible && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessible={false}
          focusable={false}
        />
      )}

      <Pressable
        style={({ hovered }: any) => [
          styles.btn,
          disabled && { opacity: 0.5 },
          { backgroundColor: C.buttonBg, borderColor: C.border },
          (hovered || visible) && { borderColor: C.primary },
          hovered && HoverShadowSoft,
        ]}
        onPress={() => setOpen(o => !o)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, expanded: visible }}
      >
        <Ionicons name="globe-outline" size={18} color={C.primary} />
        {!compact && <Text style={[styles.btnText, { color: C.text }]}>{LANGUAGE_NAMES[language]}</Text>}
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={16} color={C.hint} />
      </Pressable>

      {/* Durante una operación, no permite elegir otro idioma. */}
      {visible && (
        <View style={[styles.menu, { backgroundColor: C.surface, borderColor: C.border, shadowColor: C.primary }]}>
          {LANG_CODES.map(code => {
            const active = language === code;
            return (
              <TouchableOpacity
                key={code}
                style={[styles.item, active && { backgroundColor: C.primaryBg }]}
                onPress={() => { onSelect(code); setOpen(false); }}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: active }}
                activeOpacity={0.8}
              >
                <Text style={styles.flag}>{LANG_FLAGS[code]}</Text>
                <Text style={[styles.itemText, { color: C.text }]}>{LANGUAGE_NAMES[code]}</Text>
                {active && <Ionicons name="checkmark" size={17} color={C.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Sube el botón y el menú por encima del resto de la barra mientras está abierto.
  raised: { zIndex: 200 },
  // En web, 'fixed' cubre toda la ventana aunque la página tenga scroll.
  backdrop: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
    cursor: 'default',
  } as any,
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, zIndex: 2 },
  btnText: { fontSize: 15, fontWeight: '700' },
  menu: {
    position: 'absolute', top: 52, right: 0, width: 220, borderRadius: 14, borderWidth: 1, padding: 8, zIndex: 3,
    shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.16, shadowRadius: 40, elevation: 12,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44, paddingHorizontal: 12, borderRadius: 10 },
  flag: { fontSize: 20 },
  itemText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
