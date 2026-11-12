import type { StateCreator } from 'zustand';
import type { BlockId } from '../../types/domain';
import type { RootState } from '../types';

/** Transient UI state; not persisted. */
export interface UiSlice {
  openBlockId: BlockId | null;
  openBlock: (id: BlockId | null) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  /** Set when saved data could not be read; holds the backup key. */
  loadError: { backupKey: string | null; message: string } | null;
  clearLoadError: () => void;
}

export const createUiSlice: StateCreator<RootState, [], [], UiSlice> = (set) => ({
  openBlockId: null,
  openBlock: (id) => set({ openBlockId: id }),
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  loadError: null,
  clearLoadError: () => set({ loadError: null }),
});
