import type { BlockId } from '../../types/domain';

/** Canonical block ID. Never change without a migration: dependencies and history reference it. */
export function makeBlockId(elevation: number, group: number, material: string): BlockId {
  return `${elevation}-${group}-${material}`;
}

/** Compare block IDs: elevation desc, group asc, then material/suffix. */
export function compareBlocks(
  a: { elevation: number; group: number; id: string },
  b: { elevation: number; group: number; id: string },
): number {
  return b.elevation - a.elevation || a.group - b.group || a.id.localeCompare(b.id);
}
