import { parseLocation } from '../drilling';
import { parseActualName, siteKey } from '../../shared/utils/site';

/**
 * Block matching between the weekly plan ("ss1890_mf_48", "ss1890_53b_mf", "osp8") and the
 * plan/actual workbook ("SS1890-48", "OSP8"): both map to "ss1890-48" / "osp8".
 */

/** Pure stockpile name: "osp8", "OSP 9". */
const STOCKPILE = /^osp\s*\d+$/i;

export function planKey(name: string): string {
  const s = name.trim();
  if (STOCKPILE.test(s)) return s.replace(/\s+/g, '').toLowerCase();
  const ref = parseLocation(s);
  return ref ? siteKey(ref) : s.toLowerCase();
}

export function actualKey(name: string): string {
  const s = name.trim();
  if (STOCKPILE.test(s)) return s.replace(/\s+/g, '').toLowerCase();
  const ref = parseActualName(s);
  return ref ? siteKey(ref) : s.toLowerCase();
}

/** Display name in the plan/actual workbook's style: "ss1890-53b" → "SS1890-53b", "osp8" → "OSP8". */
export function displayName(key: string): string {
  return key.replace(/^[a-z]+/, (pit) => pit.toUpperCase());
}
