import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS } from '../features/settings/defaults';
import { backupRaw, idbStorage } from './idbStorage';
import { migrate, PERSIST_VERSION } from './migrations';
import { persistedSchema } from './schema';
import { createBlocksSlice } from './slices/blocks';
import { createHistorySlice } from './slices/history';
import { createPlanSlice } from './slices/plan';
import { createPrefsSlice } from './slices/prefs';
import { createSettingsSlice } from './slices/settings';
import { createSolutionSlice } from './slices/solution';
import { createUiSlice } from './slices/ui';
import type { RootState } from './types';

export type { RootState };

// Note: slices import pure, React-free feature modules directly (not via feature index.ts),
// because feature indexes export components that import this store (circular import).
export type { AcceptResult, UndoResult } from './slices/history';

export const STORAGE_KEY = 'pitflow-state';

/** Persisted subset: inputs, settings, last solution and history. UI state is not persisted. */
type Persisted = Pick<
  RootState,
  'blocks' | 'userInputs' | 'plan' | 'settings' | 'solution' | 'history' | 'language'
>;

const partialize = (s: RootState): Persisted => ({
  blocks: s.blocks,
  userInputs: s.userInputs,
  plan: s.plan,
  settings: s.settings,
  solution: s.solution,
  history: s.history,
  language: s.language,
});

export const useAppStore = create<RootState>()(
  persist(
    (...a) => ({
      ...createBlocksSlice(...a),
      ...createPlanSlice(...a),
      ...createSettingsSlice(...a),
      ...createSolutionSlice(...a),
      ...createHistorySlice(...a),
      ...createPrefsSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: STORAGE_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => idbStorage),
      partialize,
      migrate: (persisted, version) => {
        try {
          return migrate(persisted, version) as RootState;
        } catch {
          // Unknown/missing migration: hand the raw data to merge, whose validation will
          // back it up and start clean instead of silently overwriting it.
          return persisted as RootState;
        }
      },
      // Validate everything that comes from storage; on failure keep a backup and start clean.
      merge: (persisted, current) => {
        if (persisted === undefined || persisted === null) return current;
        const parsed = persistedSchema.safeParse(persisted);
        if (parsed.success) {
          const data = parsed.data;
          return {
            ...current,
            ...data,
            // Fill settings added later with defaults (in addition to migrations).
            settings: { ...DEFAULT_SETTINGS, ...data.settings } as RootState['settings'],
            plan: { ...current.plan, ...data.plan } as RootState['plan'],
          };
        }
        const message = parsed.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        void backupRaw(STORAGE_KEY, persisted).then((backupKey) =>
          useAppStore.setState({ loadError: { backupKey, message } }),
        );
        return { ...current, loadError: { backupKey: null, message } };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          useAppStore.setState({
            loadError: {
              backupKey: null,
              message: error instanceof Error ? error.message : String(error),
            },
          });
        }
      },
    },
  ),
);

/** Wipe all saved data (blocks, inputs, history, settings) and start empty. */
export async function clearAllData(): Promise<void> {
  await useAppStore.persist.clearStorage();
  window.location.reload();
}
