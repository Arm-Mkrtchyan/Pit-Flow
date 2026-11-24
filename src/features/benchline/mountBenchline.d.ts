import type { Language } from '../../shared/i18n/t';

/** A mounted Benchline page (scheduler tabs + DTM tab). */
export interface BenchlineInstance {
  /** Re-render every label in the given language; calculations and loaded data are kept. */
  setLang(lang: Language): void;
  /** Release charts, timers, listeners, observers, WebGL and offscreen canvases. */
  destroy(): void;
}

/**
 * Mount Benchline into `root`, which must already hold template.html and be in the document.
 * The controller is plain JavaScript ported from the standalone app (see benchline/INTEGRATION.md).
 */
export function mountBenchline(root: HTMLElement, opts?: { lang?: Language }): BenchlineInstance;
