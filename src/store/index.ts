import { create } from 'zustand';
import { createBlocksSlice } from './slices/blocks';
import { createSettingsSlice } from './slices/settings';
import { createSolutionSlice } from './slices/solution';
import { createUiSlice } from './slices/ui';
import type { RootState } from './types';

export type { RootState };

/** Single app store. Persistence (IndexedDB) is added in M7. */
export const useAppStore = create<RootState>()((...a) => ({
  ...createBlocksSlice(...a),
  ...createSettingsSlice(...a),
  ...createSolutionSlice(...a),
  ...createUiSlice(...a),
}));
