import { useEffect, useState, type RefObject } from 'react';

/** Track an element's content height (for virtual lists that need a pixel height). */
export function useElementHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h !== undefined) setHeight(Math.floor(h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return height;
}
