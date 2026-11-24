import type { Language } from '../../shared/i18n/t';
import { mountBenchline, type BenchlineInstance } from './mountBenchline';
import template from './template.html?raw';
import './benchline.css';

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap&subset=cyrillic';

/** IBM Plex (Benchline's typefaces), added once when the page is first opened. System fonts are the fallback. */
function loadFonts(): void {
  if (document.head.querySelector('link[data-benchline-fonts]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONTS_HREF;
  link.dataset.benchlineFonts = '';
  document.head.appendChild(link);
}

interface Live {
  el: HTMLDivElement;
  app: BenchlineInstance;
  disposeTimer: number | undefined;
}

let live: Live | null = null;

/**
 * Show Benchline inside `host` and return the detach function.
 *
 * A detach only takes effect after the current task: the app remounts every page on a language change
 * (and StrictMode mounts twice), so a re-attach right after a detach reuses the same instance and the
 * loaded block model, DTM and recorded points survive. Leaving the page destroys it.
 */
export function attachBenchline(host: HTMLElement, lang: Language): () => void {
  let cur = live;
  if (cur) {
    window.clearTimeout(cur.disposeTimer);
    cur.disposeTimer = undefined;
    host.appendChild(cur.el);
    cur.app.setLang(lang);
  } else {
    loadFonts();
    const el = document.createElement('div');
    el.className = 'benchline';
    el.innerHTML = template;
    // Mount after attaching: canvases and charts size themselves from the layout.
    host.appendChild(el);
    cur = { el, app: mountBenchline(el, { lang }), disposeTimer: undefined };
    live = cur;
  }
  const mine = cur;
  return () => {
    window.clearTimeout(mine.disposeTimer);
    mine.disposeTimer = window.setTimeout(() => {
      mine.app.destroy();
      mine.el.remove();
      if (live === mine) live = null;
    }, 0);
  };
}
