import { useEffect, useState } from 'react';

const remaining = (availableAt?: number): number =>
  availableAt ? Math.max(0, Math.ceil((availableAt - Date.now()) / 1000)) : 0;

/** Segundos que faltan hasta `availableAt` (marca de tiempo). No se reinicia al remontar la pantalla. */
export function useResendCooldown(availableAt?: number) {
  const [seconds, setSeconds] = useState(() => remaining(availableAt));

  useEffect(() => {
    setSeconds(remaining(availableAt));
    if (!availableAt || availableAt <= Date.now()) return undefined;
    const id = setInterval(() => {
      const left = remaining(availableAt);
      setSeconds(left);
      if (left <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [availableAt]);

  return { seconds, canResend: seconds <= 0 };
}
