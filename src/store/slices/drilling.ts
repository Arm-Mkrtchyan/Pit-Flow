import type { StateCreator } from 'zustand';
import type {
  DrillAssignment,
  DrillBlockKey,
  DrillingState,
  DrillRig,
  DrillSettings,
  DrillSourceBlock,
  IsoDate,
} from '../../types/domain';
import { defaultDrilling, firstRow } from '../../features/drilling/defaults';
import type { RootState } from '../types';

export interface DrillingSlice {
  drilling: DrillingState;
  /** Replace the drilling block list; rig rows of blocks that are gone are dropped. */
  setDrillBlocks: (blocks: DrillSourceBlock[]) => void;
  setDrillRange: (range: [IsoDate, IsoDate] | null) => void;
  /** Replace the equipment list. Rows keep their rig ID; unknown rigs are flagged in the table. */
  setRigs: (rigs: DrillRig[]) => void;
  addRigRow: (key: DrillBlockKey) => void;
  removeRigRow: (key: DrillBlockKey, rowId: string) => void;
  setRowRig: (key: DrillBlockKey, rowId: string, rigId: string | null) => void;
  /** Start this row on `date`; clicking the current start again clears it. */
  toggleStart: (key: DrillBlockKey, rowId: string, date: IsoDate) => void;
  setDrilledLm: (key: DrillBlockKey, rowId: string, lm: number) => void;
  setDrillSettings: (patch: Partial<DrillSettings>) => void;
}

const rowsOf = (s: RootState, key: DrillBlockKey): DrillAssignment[] =>
  s.drilling.assignments[key] ?? [firstRow()];

export const createDrillingSlice: StateCreator<RootState, [], [], DrillingSlice> = (set) => {
  /** Update one block's rows; an unchanged result leaves state untouched. */
  const updateRows = (
    key: DrillBlockKey,
    fn: (rows: DrillAssignment[]) => DrillAssignment[] | null,
  ) =>
    set((s) => {
      const next = fn(rowsOf(s, key));
      if (!next) return {};
      return {
        drilling: { ...s.drilling, assignments: { ...s.drilling.assignments, [key]: next } },
      };
    });
  const updateRow = (
    key: DrillBlockKey,
    rowId: string,
    fn: (row: DrillAssignment) => DrillAssignment,
  ) => updateRows(key, (rows) => rows.map((r) => (r.rowId === rowId ? fn(r) : r)));

  return {
    drilling: defaultDrilling(),

    setDrillBlocks: (blocks) =>
      set((s) => {
        const keys = new Set(blocks.map((b) => b.key));
        const assignments = Object.fromEntries(
          Object.entries(s.drilling.assignments).filter(([k]) => keys.has(k)),
        );
        return { drilling: { ...s.drilling, blocks, assignments } };
      }),

    setDrillRange: (range) => set((s) => ({ drilling: { ...s.drilling, range } })),

    setRigs: (rigs) => set((s) => ({ drilling: { ...s.drilling, rigs } })),

    addRigRow: (key) =>
      updateRows(key, (rows) => [
        ...rows,
        { rowId: crypto.randomUUID(), rigId: null, start: null, drilledLm: 0 },
      ]),

    removeRigRow: (key, rowId) =>
      updateRows(key, (rows) => (rows.length > 1 ? rows.filter((r) => r.rowId !== rowId) : null)),

    setRowRig: (key, rowId, rigId) => updateRow(key, rowId, (r) => ({ ...r, rigId })),

    toggleStart: (key, rowId, date) =>
      updateRow(key, rowId, (r) => ({ ...r, start: r.start === date ? null : date })),

    setDrilledLm: (key, rowId, lm) =>
      updateRow(key, rowId, (r) => ({
        ...r,
        drilledLm: Number.isFinite(lm) ? Math.max(lm, 0) : 0,
      })),

    setDrillSettings: (patch) =>
      set((s) => ({
        drilling: { ...s.drilling, settings: { ...s.drilling.settings, ...patch } },
      })),
  };
};
