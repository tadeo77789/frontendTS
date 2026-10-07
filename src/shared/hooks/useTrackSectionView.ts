import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../app/providers/AuthContext';
import { statsService, type TrackedSection } from '../../feature/Stats/services/stats.service';

/** Registra una visita a la seccion cada vez que la pantalla recibe el foco (solo con sesion). */
export const useTrackSectionView = (section: TrackedSection): void => {
  const { isAuthenticated } = useAuth();
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) statsService.trackSectionView(section);
    }, [isAuthenticated, section]),
  );
};
