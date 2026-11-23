import type { Block, BlockId, BlockUserInput } from '../../types/domain';

export type ReimportMode = 'replace' | 'merge';

export interface MergeReport {
  added: number;
  updated: number;
  removed: BlockId[];
  /** `child → parent` dependencies dropped because the parent no longer exists. */
  droppedDependencies: string[];
  /** Blocks whose remaining stock was clamped to the new weight. */
  clamped: BlockId[];
}

/** Daily limit given on import to blocks whose name contains "lgw", t/day. */
export const LGW_DAILY_MAX = 6000;

/** The block's site name or ID contains "lgw" (any case). */
export function isLgwBlock(block: Block): boolean {
  return /lgw/i.test(block.site ?? '') || /lgw/i.test(block.id);
}

export function defaultUserInput(block: Block): BlockUserInput {
  const input: BlockUserInput = { remaining: block.weight, dependsOn: [] };
  if (isLgwBlock(block)) input.dailyMax = LGW_DAILY_MAX;
  return input;
}

/** Combine an import with existing state. Merge keeps user stock and dependencies by block ID. */
export function applyImport(
  mode: ReimportMode,
  incoming: Block[],
  existingBlocks: Block[],
  existingInputs: Record<BlockId, BlockUserInput>,
): { blocks: Block[]; userInputs: Record<BlockId, BlockUserInput>; report: MergeReport } {
  const userInputs: Record<BlockId, BlockUserInput> = {};
  const report: MergeReport = {
    added: 0,
    updated: 0,
    removed: [],
    droppedDependencies: [],
    clamped: [],
  };
  const incomingIds = new Set(incoming.map((b) => b.id));

  for (const b of incoming) {
    const prev = mode === 'merge' ? existingInputs[b.id] : undefined;
    if (!prev) {
      userInputs[b.id] = defaultUserInput(b);
      report.added++;
      continue;
    }
    report.updated++;
    const remaining = Math.min(Math.max(prev.remaining, 0), b.weight);
    if (remaining !== prev.remaining) report.clamped.push(b.id);
    const dependsOn = prev.dependsOn.filter((p) => {
      const keep = incomingIds.has(p);
      if (!keep) report.droppedDependencies.push(`${b.id} → ${p}`);
      return keep;
    });
    // Keep recalculated grades and actuals info along with stock and dependencies.
    const next: BlockUserInput = { ...prev, remaining, dependsOn };
    // An "lgw" block gets its default limit unless the planner already set one.
    if (next.dailyMax === undefined && isLgwBlock(b)) next.dailyMax = LGW_DAILY_MAX;
    userInputs[b.id] = next;
  }
  if (mode === 'merge') {
    report.removed = existingBlocks.filter((b) => !incomingIds.has(b.id)).map((b) => b.id);
  }
  return { blocks: incoming, userInputs, report };
}
