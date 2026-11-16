import type { StateCreator } from 'zustand';
import type { Block, BlockId, BlockUserInput } from '../../types/domain';
import { findCycleIfSet, graphFromInputs } from '../../features/blocks/dependencyGraph';
import { drillBlockKey } from '../../features/drilling/drillBlocks';
import type { RootState } from '../types';

export type SetDependsOnResult = { ok: true } | { ok: false; cycle: BlockId[] };

export interface BlocksSlice {
  blocks: Block[];
  userInputs: Record<BlockId, BlockUserInput>;
  /** Replace the whole block set (after import/merge). */
  setBlocks: (blocks: Block[], userInputs: Record<BlockId, BlockUserInput>) => void;
  /** Set remaining stock, clamped to [0, weight]. */
  setRemaining: (id: BlockId, remaining: number) => void;
  /** Set parents; rejected (state unchanged) if it would create a cycle. */
  setDependsOn: (id: BlockId, parents: BlockId[]) => SetDependsOnResult;
}

export const createBlocksSlice: StateCreator<RootState, [], [], BlocksSlice> = (set, get) => ({
  blocks: [],
  userInputs: {},

  setBlocks: (blocks, userInputs) => {
    set((s) => ({ blocks, userInputs, solution: { ...s.solution, stale: true } }));
    // Rig rows of drilling blocks that are gone are dropped; the others are kept.
    get().pruneDrillAssignments(new Set(blocks.map(drillBlockKey)));
  },

  setRemaining: (id, remaining) =>
    set((s) => {
      const block = s.blocks.find((b) => b.id === id);
      const input = s.userInputs[id];
      if (!block || !input || !Number.isFinite(remaining)) return {};
      const clamped = Math.min(Math.max(remaining, 0), block.weight);
      if (clamped === input.remaining) return {};
      return {
        userInputs: { ...s.userInputs, [id]: { ...input, remaining: clamped } },
        solution: { ...s.solution, stale: true },
      };
    }),

  setDependsOn: (id, parents) => {
    const s = get();
    const input = s.userInputs[id];
    if (!input) return { ok: true };
    const unique = [...new Set(parents)].filter((p) => p in s.userInputs);
    const cycle = findCycleIfSet(graphFromInputs(s.userInputs), id, unique);
    if (cycle) return { ok: false, cycle };
    const same =
      unique.length === input.dependsOn.length && unique.every((p, i) => p === input.dependsOn[i]);
    if (!same) {
      set({
        userInputs: { ...s.userInputs, [id]: { ...input, dependsOn: unique } },
        solution: { ...s.solution, stale: true },
      });
    }
    return { ok: true };
  },
});
