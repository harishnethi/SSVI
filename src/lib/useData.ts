import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data whenever the screen comes into focus, so lists refresh after
 * editing a record on another screen. `deps` should hold the route params the loader uses.
 */
export function useData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadRef.current());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const depsKey = JSON.stringify(deps);
  useFocusEffect(
    useCallback(() => {
      reload();
      // depsKey is intentional: reload again when the route params change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload, depsKey]),
  );

  return { data, error, loading, reload };
}

/** Throws the Supabase error, otherwise returns the data. */
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
