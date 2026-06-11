"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media query hook. Renders desktop-first (false) on the server and
 * first client paint to avoid hydration mismatches, then resolves after mount
 * and stays in sync on resize/orientation change.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Shared breakpoints. */
export const BP = {
  /** phones */
  mobile: "(max-width: 600px)",
  /** narrow header — hide secondary chrome */
  compactBar: "(max-width: 640px)",
  /** tablet & below — stack the dataset two-column layout */
  stack: "(max-width: 860px)",
};
