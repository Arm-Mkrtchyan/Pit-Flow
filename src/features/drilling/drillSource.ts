/** Drilling locations: name parsing, grouping helpers and migration of the old block list. */
import type { Block, DrillSourceBlock, IsoDate } from '../../types/domain';
import { dayNumberToIso, isoToDayNumber } from '../../shared/utils/dates';
import { parseSiteName, siteKey, type SiteRef } from '../../shared/utils/site';

const NUMBER = /^\d+[a-z]?$/;
const PIT_ELEV = /^([a-z]*)(\d{3,4})$/;

/**
 * Pit, elevation and number from a Mining Location. Besides the usual "location_cn1740_mf_24"
 * the number may stand before the material: "location_ss1890_53b_mf" → SS1890-53b.
 * Names without a block number ("lgw_1875") → null.
 */
export function parseLocation(raw: string): SiteRef | null {
  const direct = parseSiteName(raw);
  if (direct) return direct;
  const tokens = raw
    .trim()
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean);
  const at = tokens.findIndex((tok) => PIT_ELEV.test(tok));
  const m = at >= 0 ? PIT_ELEV.exec(tokens[at] ?? '') : null;
  const number = tokens.filter((tok, i) => i !== at && NUMBER.test(tok)).at(-1);
  if (!m || !number) return null;
  return { pit: (m[1] ?? '').toUpperCase(), elevation: Number(m[2]), number };
}

/** Rig-row key of a location: the site key used on the extraction page, else the name itself. */
export function locationKey(raw: string): string {
  const ref = parseLocation(raw);
  return ref ? siteKey(ref) : raw.trim().toLowerCase();
}

/** Days from `start` up to but excluding `endExclusive` (at least `start` itself). */
export function daysBetween(start: IsoDate, endExclusive: IsoDate | undefined): IsoDate[] {
  const a = isoToDayNumber(start);
  const b = endExclusive !== undefined ? isoToDayNumber(endExclusive) : a + 1;
  const out: IsoDate[] = [];
  for (let d = a; d < Math.max(b, a + 1); d++) out.push(dayNumberToIso(d));
  return out;
}

export interface Acc {
  block: DrillSourceBlock;
  days: Set<IsoDate>;
  materials: Set<string>;
}

export function accumulate(
  byKey: Map<string, Acc>,
  location: string,
  key: string,
  elevation: number,
): Acc {
  let acc = byKey.get(key);
  if (!acc) {
    acc = {
      block: { key, location, elevation, volume: 0, materials: [], miningDays: [] },
      days: new Set(),
      materials: new Set(),
    };
    byKey.set(key, acc);
  }
  return acc;
}

export function finish(byKey: Map<string, Acc>): DrillSourceBlock[] {
  return [...byKey.values()].map(({ block, days, materials }) => ({
    ...block,
    materials: [...materials],
    miningDays: [...days].sort(),
  }));
}

/**
 * Convert the drilling block list of persisted v6 (extraction-style block rows) to locations.
 * Keys stay `siteKey ?? id`, so existing rig rows keep their blocks.
 */
export function fromLegacyBlocks(blocks: readonly Block[]): DrillSourceBlock[] {
  const byKey = new Map<string, Acc>();
  for (const b of blocks) {
    const acc = accumulate(byKey, b.site ?? b.id, b.siteKey ?? b.id, b.elevation);
    if (b.volume !== undefined) acc.block.volume += b.volume;
    else if (b.density !== undefined && b.density > 0) acc.block.volume += b.weight / b.density;
    acc.materials.add(b.material.toUpperCase());
    if (b.miningStart && b.miningEnd) {
      const end = dayNumberToIso(isoToDayNumber(b.miningEnd) + 1);
      for (const d of daysBetween(b.miningStart, end)) acc.days.add(d);
    }
  }
  return finish(byKey);
}
