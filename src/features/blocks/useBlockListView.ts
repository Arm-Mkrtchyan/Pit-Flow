import { useMemo } from 'react';
import type { Block, BlockClass, BlockId, BlockUserInput } from '../../types/domain';
import { classifyBlock } from '../../shared/utils/blockClass';
import { compareBlocks } from '../../shared/utils/ids';

export type SortKey = 'id' | 'remaining' | 'cu' | 'mo' | 'eq';
export type ClassFilter = BlockClass | 'all';

export interface BlockFilters {
  search: string;
  materials: string[];
  cls: ClassFilter;
  sort: SortKey;
}

export interface BlockView {
  block: Block;
  cls: BlockClass;
  remaining: number;
  exhausted: boolean;
  /** Parents that still hold stock (block cannot be used yet). */
  lockedBy: BlockId[];
}

export type ListRow =
  | { type: 'header'; key: string; elevation: number; count: number; collapsed: boolean }
  | { type: 'block'; key: string; view: BlockView };

const EPS = 1e-6;

export function buildBlockViews(
  blocks: Block[],
  inputs: Record<BlockId, BlockUserInput>,
  oreCutoffEq: number,
): BlockView[] {
  return blocks.map((block) => {
    const input = inputs[block.id];
    const remaining = input?.remaining ?? block.weight;
    const lockedBy = (input?.dependsOn ?? []).filter((p) => (inputs[p]?.remaining ?? 0) > EPS);
    return {
      block,
      cls: classifyBlock(block, oreCutoffEq),
      remaining,
      exhausted: remaining <= EPS,
      lockedBy,
    };
  });
}

function compare(sort: SortKey, a: BlockView, b: BlockView): number {
  // Exhausted blocks always sink to the bottom of their group.
  if (a.exhausted !== b.exhausted) return a.exhausted ? 1 : -1;
  switch (sort) {
    case 'remaining':
      return b.remaining - a.remaining || compareBlocks(a.block, b.block);
    case 'cu':
    case 'mo':
    case 'eq':
      return b.block[sort] - a.block[sort] || compareBlocks(a.block, b.block);
    case 'id':
      return compareBlocks(a.block, b.block);
  }
}

/** Filter, sort and group blocks by elevation into a flat row list for a virtual list. */
export function useBlockListView(
  views: BlockView[],
  filters: BlockFilters,
  collapsed: ReadonlySet<number>,
): { rows: ListRow[]; shown: number } {
  return useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const filtered = views.filter(
      (v) =>
        (q === '' || v.block.id.toLowerCase().includes(q)) &&
        (filters.materials.length === 0 || filters.materials.includes(v.block.material)) &&
        (filters.cls === 'all' || v.cls === filters.cls),
    );

    const byElevation = new Map<number, BlockView[]>();
    for (const v of filtered) {
      const list = byElevation.get(v.block.elevation) ?? [];
      list.push(v);
      byElevation.set(v.block.elevation, list);
    }

    const rows: ListRow[] = [];
    [...byElevation.keys()]
      .sort((a, b) => b - a)
      .forEach((elevation) => {
        const list = byElevation.get(elevation) ?? [];
        const isCollapsed = collapsed.has(elevation);
        rows.push({
          type: 'header',
          key: `h:${elevation}`,
          elevation,
          count: list.length,
          collapsed: isCollapsed,
        });
        if (!isCollapsed) {
          list
            .sort((a, b) => compare(filters.sort, a, b))
            .forEach((view) => rows.push({ type: 'block', key: view.block.id, view }));
        }
      });
    return { rows, shown: filtered.length };
  }, [views, filters, collapsed]);
}
