import type { Block, BlockId, DrillBlockKey, IsoDate } from '../../types/domain';
import { parseSiteName } from '../../shared/utils/site';

/**
 * A drilling block: all block-file rows of one Участок (MF, MF_OX, WD …) are drilled and blasted
 * together. Rows without a site are their own drilling block.
 */
export interface DrillBlock {
  key: DrillBlockKey;
  /** Display name, e.g. "CN1740-17". */
  name: string;
  /** Raw Участок name, if any. */
  site?: string;
  /** Pit code, lower-case ("cn", "ss"); "" if unknown. Selects the rig productivity. */
  position: string;
  /** Σ volume of the rows, m³. Rows without volume use weight / density. */
  volume: number;
  /** Rows whose volume could not be determined (neither volume nor density). */
  volumeMissing: BlockId[];
  blockIds: BlockId[];
  /** Planned mining periods of the rows (inclusive). */
  mining: Array<[IsoDate, IsoDate]>;
}

export const drillBlockKey = (b: Block): DrillBlockKey => b.siteKey ?? b.id;

function rowVolume(b: Block): number | undefined {
  if (b.volume !== undefined) return b.volume;
  if (b.density !== undefined && b.density > 0) return b.weight / b.density;
  return undefined;
}

/** Group blocks into drilling blocks, in file order of first appearance. */
export function buildDrillBlocks(blocks: readonly Block[]): DrillBlock[] {
  const byKey = new Map<DrillBlockKey, DrillBlock>();
  for (const b of blocks) {
    const key = drillBlockKey(b);
    let d = byKey.get(key);
    if (!d) {
      const ref = b.site !== undefined ? parseSiteName(b.site) : null;
      d = {
        key,
        name: ref ? `${ref.pit}${ref.elevation}-${ref.number}` : b.id,
        ...(b.site !== undefined ? { site: b.site } : {}),
        position: ref ? ref.pit.toLowerCase() : '',
        volume: 0,
        volumeMissing: [],
        blockIds: [],
        mining: [],
      };
      byKey.set(key, d);
    }
    d.blockIds.push(b.id);
    const v = rowVolume(b);
    if (v === undefined) d.volumeMissing.push(b.id);
    else d.volume += v;
    if (b.miningStart && b.miningEnd) d.mining.push([b.miningStart, b.miningEnd]);
  }
  return [...byKey.values()];
}

export const isMiningDay = (d: DrillBlock, date: IsoDate): boolean =>
  d.mining.some(([a, b]) => a <= date && date <= b);
