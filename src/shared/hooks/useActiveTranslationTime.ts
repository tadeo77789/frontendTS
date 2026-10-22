import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

/** No durations are sent: only foreground heartbeats. Backend requires recent confirmed activity. */
export const useActiveTranslationTime = (enabled: boolean,
  recordActivity: (body: Record<string, unknown>) => Promise<unknown>, onBackground: () => void) => {
  useEffect(() => {
    if (!enabled) return;
    let foreground = AppState.currentState === 'active';
    const visible = () => foreground && (Platform.OS !== 'web' || (document.visibilityState === 'visible' && document.hasFocus()));
    const pause = () => {
      onBackground();
      void recordActivity({ kind: 'pause' }).catch(() => undefined);
    };
    const subscription = AppState.addEventListener('change', state => { foreground = state === 'active'; if (!foreground) pause(); });
    const onVisibility = () => { if (!visible()) pause(); };
    if (Platform.OS === 'web') {
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('blur', pause);
    }
    const interval = setInterval(() => {
      if (visible()) void recordActivity({ kind: 'tick' }).catch(() => undefined);
    }, 5000);
    return () => {
      clearInterval(interval); subscription.remove();
      if (Platform.OS === 'web') {
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('blur', pause);
      }
      pause();
    };
  }, [enabled, recordActivity, onBackground]);

};
