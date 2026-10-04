import { useEffect, useState } from "react";
import { cached } from "./db";

/**
 * Daten mit Zwischenspeicher laden: zeigt gespeicherte Daten sofort,
 * ersetzt sie, sobald frische da sind.
 */
export function useCached(key, loader, fallback) {
  const [state, setState] = useState(() => {
    const { initial } = cached(key, loader);
    return { data: initial ?? fallback, loading: initial === undefined, error: "" };
  });

  useEffect(() => {
    let alive = true;
    cached(key, loader)
      .fresh.then((data) => alive && setState({ data, loading: false, error: "" }))
      .catch((error) => alive && setState((current) => ({ ...current, loading: false, error: error.message })));
    return () => {
      alive = false;
    };
    // loader ist eine stabile Modulfunktion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
