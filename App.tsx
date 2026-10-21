import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider } from './src/app/providers/AuthContext';
import { AccessProvider } from './src/app/providers/AccessContext';
import { ThemeProvider, useTheme } from './src/app/providers/ThemeContext';
import { LanguageProvider } from './src/app/providers/LanguageContext';
import { AppNavigator } from './src/app/routes/AppNavigator';
import { PreferencesProvider } from './src/app/providers/PreferencesContext';
import { isWordEngineEmbed, WordEngineEmbed } from './src/feature/Translation/embed/WordEngineEmbed';

// En web, la ventana emergente de Facebook vuelve a la app con el token: esto
// se lo entrega a la ventana principal y la cierra.
WebBrowser.maybeCompleteAuthSession();

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  // Dentro del WebView de la app nativa solo hace falta el motor de palabras:
  // sin sesion, navegacion ni tema.
  if (isWordEngineEmbed()) return <WordEngineEmbed />;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
             <PreferencesProvider>
               <AccessProvider>
                 <AppContent />
               </AccessProvider>
             </PreferencesProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
