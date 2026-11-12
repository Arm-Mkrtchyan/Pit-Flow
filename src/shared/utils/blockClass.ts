import type { Block, BlockClass } from '../../types/domain';

/** Ore iff Cu-equivalent is at or above the cutoff; otherwise waste (barren rock). */
export function classifyBlock(block: Pick<Block, 'eq'>, oreCutoffEq: number): BlockClass {
  return block.eq >= oreCutoffEq ? 'ore' : 'waste';
}
