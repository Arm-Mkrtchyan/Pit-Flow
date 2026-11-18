import type { StateCreator } from 'zustand';
import type { Block, BlockId, BlockUserInput, GradeField } from '../../types/domain';
import { findCycleIfSet, graphFromInputs } from '../../features/blocks/dependencyGraph';
import type { RootState } from '../types';

const GRADE_FIELDS: readonly GradeField[] = ['cu', 'mo', 'as', 'pb', 'eq'];
/** Below any displayed precision (3 decimals for %, 1 for g/t). */
const GRADE_EPS = 1e-9;

export type SetDependsOnResult = { ok: true } | { ok: false; cycle: BlockId[] };

export interface BlocksSlice {
  blocks: Block[];
  userInputs: Record<BlockId, BlockUserInput>;
  /** Replace the whole block set (after import/merge). */
  setBlocks: (blocks: Block[], userInputs: Record<BlockId, BlockUserInput>) => void;
  /** Set remaining stock, clamped to [0, weight]. */
  setRemaining: (id: BlockId, remaining: number) => void;
  /**
   * Set the current grades of a block. A missing value, or one equal to the file value, means the
   * file value; only differing values are stored.
   */
  setGrades: (id: BlockId, grades: Partial<Record<GradeField, number>>) => void;
  /** Set parents; rejected (state unchanged) if it would create a cycle. */
  setDependsOn: (id: BlockId, parents: BlockId[]) => SetDependsOnResult;
}

export const createBlocksSlice: StateCreator<RootState, [], [], BlocksSlice> = (set, get) => ({
  blocks: [],
  userInputs: {},

  setBlocks: (blocks, userInputs) =>
    set((s) => ({ blocks, userInputs, solution: { ...s.solution, stale: true } })),

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

  setGrades: (id, grades) =>
    set((s) => {
      const block = s.blocks.find((b) => b.id === id);
      const input = s.userInputs[id];
      if (!block || !input) return {};
      const next: Partial<Record<GradeField, number>> = {};
      for (const f of GRADE_FIELDS) {
        const v = grades[f];
        if (v === undefined || !Number.isFinite(v) || v < 0) continue;
        const fileV = block[f];
        if (fileV === undefined || Math.abs(v - fileV) > GRADE_EPS) next[f] = v;
      }
      const prev = input.grades ?? {};
      const same =
        GRADE_FIELDS.every((f) => prev[f] === next[f]) &&
        Object.keys(prev).length === Object.keys(next).length;
      if (same) return {};
      const updated: BlockUserInput = { ...input, grades: next };
      if (Object.keys(next).length === 0) delete updated.grades;
      return {
        userInputs: { ...s.userInputs, [id]: updated },
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
