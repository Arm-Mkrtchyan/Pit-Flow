import { useSyncExternalStore } from 'react';
import { useAppStore } from './index';

/** True once persisted state has been loaded from IndexedDB. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useAppStore.persist.onFinishHydration(cb),
    () => useAppStore.persist.hasHydrated(),
  );
}
