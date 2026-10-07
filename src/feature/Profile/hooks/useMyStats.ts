import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { profileStatsService } from '../services/profileStats.service';
import type { MyStats } from '../data/achievements';

/** Carga las estadisticas del usuario cada vez que Perfil recibe el foco. */
export const useMyStats = () => {
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setStats(await profileStatsService.getMine());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { stats, loading, error, reload: load };
};
