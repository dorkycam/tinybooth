'use client';

import { useEffect, useState } from 'react';

/**
 * Read/write a value from localStorage. Returns the same `[value, setValue]`
 * shape as useState. Falls back to `initial` on the server.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore parse errors */
    }
  }, [key]);

  const update = (next: T): void => {
    setValue(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
    }
  };

  return [value, update];
}
