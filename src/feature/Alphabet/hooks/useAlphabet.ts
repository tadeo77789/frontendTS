import { useEffect, useState } from 'react';
import { LOCAL_ALPHABET, type AlphabetLetter } from '../data/alphabet';
import { fetchAlphabet } from '../services/lexicon.service';

/**
 * Pinta de inmediato el alfabeto empaquetado y lo reemplaza por el del
 * lexico cuando responde el backend. Si la API no esta, se queda el local.
 */
export const useAlphabet = () => {
  const [letters, setLetters] = useState<AlphabetLetter[]>(LOCAL_ALPHABET);
  const [source, setSource] = useState<'local' | 'server'>('local');

  useEffect(() => {
    let alive = true;
    fetchAlphabet()
      .then(remote => {
        if (!alive) return;
        setLetters(remote);
        setSource('server');
      })
      .catch(err => {
        if (__DEV__) console.warn('[useAlphabet] lexicon no disponible, uso el alfabeto local:', err?.message ?? err);
      });
    return () => { alive = false; };
  }, []);

  return { letters, source };
};
