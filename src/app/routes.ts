import { useSyncExternalStore } from 'react';
import type { I18nKey } from '../shared/i18n/en';

/**
 * Minimal hash router (no dependency): #/ · #/extraction · #/drilling · #/resources · #/deviation ·
 * #/benchline.
 * The page lives in the URL, not in persisted state, so back/forward, bookmarks and reload work.
 */
export type PageId = 'home' | 'extraction' | 'drilling' | 'resources' | 'deviation' | 'benchline';

export const PAGES: ReadonlyArray<{ id: Exclude<PageId, 'home'>; titleKey: I18nKey }> = [
  { id: 'extraction', titleKey: 'page.extraction' },
  { id: 'drilling', titleKey: 'page.drilling' },
  { id: 'resources', titleKey: 'page.resources' },
  { id: 'deviation', titleKey: 'page.deviation' },
  { id: 'benchline', titleKey: 'page.benchline' },
];

const HASH: Record<PageId, string> = {
  home: '#/',
  extraction: '#/extraction',
  drilling: '#/drilling',
  resources: '#/resources',
  deviation: '#/deviation',
  benchline: '#/benchline',
};

export function pageHref(page: PageId): string {
  return HASH[page];
}

function pageFromHash(hash: string): PageId {
  const path = hash.replace(/^#\/?/, '').split(/[/?]/)[0] ?? '';
  return path === 'extraction' ||
    path === 'drilling' ||
    path === 'resources' ||
    path === 'deviation' ||
    path === 'benchline'
    ? path
    : 'home';
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getSnapshot = (): PageId => pageFromHash(window.location.hash);

export function useCurrentPage(): PageId {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function navigate(page: PageId): void {
  window.location.hash = HASH[page];
}
