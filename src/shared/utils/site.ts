/**
 * Site (Участок) names link block-list rows to actual-extraction rows.
 *   block file:  "location_cn1740_mf_17"  → pit CN, elevation 1740, number "17"
 *   actuals:     "CN1740-17", "SS1875-27a"
 * Matching key: "<pit><elevation>-<number>", lower-case (e.g. "cn1740-17").
 */
export interface SiteRef {
  /** Pit code, upper-case (e.g. "CN"); empty when the name has none (e.g. "1740_MF_1"). */
  pit: string;
  elevation: number;
  /** Block number with optional letter suffix, lower-case (e.g. "17", "27a"). */
  number: string;
}

const NUMBER = /^\d+[a-z]?$/;
const PIT_ELEV = /^([a-z]*)(\d{3,4})$/;

/** Parse a block-file site name such as "location_cn1740_mf_17" or "1740_MF_1". */
export function parseSiteName(raw: string): SiteRef | null {
  const tokens = raw
    .trim()
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean);
  const number = tokens.at(-1);
  if (!number || tokens.length < 2 || !NUMBER.test(number)) return null;
  for (const tok of tokens.slice(0, -1)) {
    const m = PIT_ELEV.exec(tok);
    if (m) return { pit: (m[1] ?? '').toUpperCase(), elevation: Number(m[2]), number };
  }
  return null;
}

/** Parse an actuals block name such as "CN1740-17" or "SS1875-27a". Stockpiles (OSP8) → null. */
export function parseActualName(raw: string): SiteRef | null {
  const m = /^([a-z]*)(\d{3,4})-(\d+[a-z]?)$/i.exec(raw.trim());
  if (!m) return null;
  return {
    pit: (m[1] ?? '').toUpperCase(),
    elevation: Number(m[2]),
    number: (m[3] ?? '').toLowerCase(),
  };
}

export const siteKey = (s: SiteRef): string => `${s.pit}${s.elevation}-${s.number}`.toLowerCase();

/** Key without the pit code, for block files whose site names have no pit. */
export const siteKeyNoPit = (s: SiteRef): string => `${s.elevation}-${s.number}`.toLowerCase();

/** Block ID for a site-named row: "CN1740_MF_17", "CN1740_MF_OX_17". */
export const siteBlockId = (s: SiteRef, material: string): string =>
  `${s.pit}${s.elevation}_${material.toUpperCase()}_${s.number}`;
