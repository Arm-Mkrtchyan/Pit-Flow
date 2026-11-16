import { useMemo } from 'react';
import { useAppStore } from '../../store';
import type { DrillRig, IsoDate } from '../../types/domain';
import { enumerateDays } from '../calendar';
import { calcDrillBlock, type BlockResult, type RowResult } from './calc';
import { firstRow } from './defaults';
import { buildDrillBlocks, type DrillBlock } from './drillBlocks';

export interface DrillTableRow {
  key: string;
  block: DrillBlock;
  result: BlockResult;
  row: RowResult;
  start: IsoDate | null;
  /** Position of this rig row within its block; the first row carries the block cells. */
  index: number;
  rowCount: number;
}

export const conflictKey = (rigId: string, date: IsoDate) => `${rigId}|${date}`;

/** Drilling blocks, their calculated rig rows, the day columns and rig double-bookings. */
export function useDrillingTable() {
  const blocks = useAppStore((s) => s.blocks);
  const { range, rigs, assignments, settings } = useAppStore((s) => s.drilling);

  const drillBlocks = useMemo(() => buildDrillBlocks(blocks), [blocks]);
  const rigsById = useMemo(() => new Map<string, DrillRig>(rigs.map((r) => [r.id, r])), [rigs]);
  const days = useMemo(() => enumerateDays(range), [range]);

  const { rows, conflicts } = useMemo(() => {
    const out: DrillTableRow[] = [];
    // Rig + date → number of rig rows drilling that day; > 1 means the rig is double-booked.
    const usage = new Map<string, number>();
    for (const block of drillBlocks) {
      const assigned = assignments[block.key] ?? [firstRow()];
      const result = calcDrillBlock(block, assigned, rigsById, settings);
      result.rows.forEach((row, index) => {
        if (row.rigId !== null && !row.preview) {
          for (const [date, lm] of row.perDay) {
            if (lm <= 0) continue;
            const k = conflictKey(row.rigId, date);
            usage.set(k, (usage.get(k) ?? 0) + 1);
          }
        }
        out.push({
          key: `${block.key}#${row.rowId}`,
          block,
          result,
          row,
          start: assigned[index]?.start ?? null,
          index,
          rowCount: result.rows.length,
        });
      });
    }
    const conflicts = new Set([...usage].filter(([, n]) => n > 1).map(([k]) => k));
    return { rows: out, conflicts };
  }, [drillBlocks, assignments, rigsById, settings]);

  return { rows, days, range, rigs, conflicts, hasBlocks: blocks.length > 0 };
}
