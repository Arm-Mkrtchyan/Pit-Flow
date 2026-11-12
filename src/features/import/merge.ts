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

export function defaultUserInput(block: Block): BlockUserInput {
  return { remaining: block.weight, dependsOn: [] };
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
    userInputs[b.id] = { remaining, dependsOn };
  }
  if (mode === 'merge') {
    report.removed = existingBlocks.filter((b) => !incomingIds.has(b.id)).map((b) => b.id);
  }
  return { blocks: incoming, userInputs, report };
}
