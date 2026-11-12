import type { Block, BlockUserInput } from '../../types/domain';

/**
 * The block as the planner should see it now: file data with grades replaced by those
 * recalculated from actual extraction (if any). Never mutates or persists anything.
 */
export function effectiveBlock(block: Block, input: BlockUserInput | undefined): Block {
  const g = input?.grades;
  if (!g) return block;
  return {
    ...block,
    cu: g.cu ?? block.cu,
    mo: g.mo ?? block.mo,
    eq: g.eq ?? block.eq,
    as: g.as ?? block.as,
    pb: g.pb ?? block.pb,
  };
}
