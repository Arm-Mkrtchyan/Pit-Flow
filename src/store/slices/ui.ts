import type { StateCreator } from 'zustand';
import type { BlockId } from '../../types/domain';
import type { RootState } from '../types';

/** Transient UI state; not persisted. */
export interface UiSlice {
  openBlockId: BlockId | null;
  openBlock: (id: BlockId | null) => void;
}

export const createUiSlice: StateCreator<RootState, [], [], UiSlice> = (set) => ({
  openBlockId: null,
  openBlock: (id) => set({ openBlockId: id }),
});
