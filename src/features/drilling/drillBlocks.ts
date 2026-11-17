import type { DrillBlockKey, DrillSourceBlock, IsoDate } from '../../types/domain';
import { parseLocation } from './drillSource';

/** A drilling block (one blast location) as shown in the drilling table. */
export interface DrillBlock {
  key: DrillBlockKey;
  /** Display name, e.g. "CN1740-24"; the location name in capitals if it has no block number. */
  name: string;
  /** Mining Location as in the file. */
  site: string;
  /** Pit code, lower-case ("cn", "ss"); "" if unknown. Selects the rig productivity. */
  position: string;
  /** Σ volume, m³. */
  volume: number;
  materials: string[];
  /** Days with scheduled mining. */
  miningDays: ReadonlySet<IsoDate>;
}

/** Drilling blocks in file order. */
export function buildDrillBlocks(sources: readonly DrillSourceBlock[]): DrillBlock[] {
  return sources.map((s) => {
    const ref = parseLocation(s.location);
    return {
      key: s.key,
      name: ref ? `${ref.pit}${ref.elevation}-${ref.number}` : s.location.toUpperCase(),
      site: s.location,
      position: ref ? ref.pit.toLowerCase() : '',
      volume: s.volume,
      materials: s.materials,
      miningDays: new Set(s.miningDays),
    };
  });
}

export const isMiningDay = (d: DrillBlock, date: IsoDate): boolean => d.miningDays.has(date);
