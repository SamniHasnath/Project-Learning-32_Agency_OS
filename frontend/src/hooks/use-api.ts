"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api";

/**
 * Loads data on mount (and whenever `deps` change). Exposes `reload()` and
 * `setData()` so pages can refresh or apply a server response after a mutation.
 */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  const requestId = useRef(0);
  // Declared before the loading effect so it always runs first.
  useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      if (id === requestId.current) setData(result);
    } catch (e) {
      if (id === requestId.current) setError(errorMessage(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Initial load and reloads when `deps` change. State is only set in the
  // promise callbacks; `loading` starts as true so no synchronous update is needed.
  useEffect(() => {
    const id = ++requestId.current;
    loaderRef.current().then(
      (result) => {
        if (id !== requestId.current) return;
        setData(result);
        setError(null);
        setLoading(false);
      },
      (e: unknown) => {
        if (id !== requestId.current) return;
        setError(errorMessage(e));
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}
