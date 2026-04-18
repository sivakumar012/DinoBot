/**
 * Animates a "..." typing indicator while waiting for a response.
 */
import { useEffect, useState } from 'react';

export function useStreamingDots(active: boolean): string {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!active) {
      setDots('');
      return;
    }
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [active]);

  return dots;
}
