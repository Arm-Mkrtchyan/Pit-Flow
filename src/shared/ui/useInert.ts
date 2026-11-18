import { useEffect, useRef, type CSSProperties } from 'react';

/**
 * Ref that makes its element `inert` (no focus, clicks or screen-reader access) while `on`.
 * React 18 has no `inert` prop, so it is set on the DOM node.
 */
export function useInert<T extends HTMLElement>(on: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (ref.current) ref.current.inert = on;
  }, [on]);
  return ref;
}

/** Faded look of a temporarily disabled area (pair with `useInert`). */
export function dimmedStyle(on: boolean): CSSProperties {
  return on
    ? { opacity: 0.35, pointerEvents: 'none', transition: 'opacity 0.2s' }
    : { transition: 'opacity 0.2s' };
}
