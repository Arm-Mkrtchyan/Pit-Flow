import type { StateCreator } from 'zustand';
import type { Block, BlockId, BlockUserInput } from '../../types/domain';
import type { RootState } from '../types';

export interface BlocksSlice {
  blocks: Block[];
  userInputs: Record<BlockId, BlockUserInput>;
  /** Replace the whole block set (after import/merge). */
  setBlocks: (blocks: Block[], userInputs: Record<BlockId, BlockUserInput>) => void;
}

export const createBlocksSlice: StateCreator<RootState, [], [], BlocksSlice> = (set) => ({
  blocks: [],
  userInputs: {},
  setBlocks: (blocks, userInputs) =>
    set((s) => ({ blocks, userInputs, solution: { ...s.solution, stale: true } })),
});
