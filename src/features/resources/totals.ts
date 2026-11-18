import { parseActualName, siteKey } from '../../shared/utils/site';
import type { ActualRow } from '../actuals';

/**
 * Exported ore per block over all actual (Փաստ) rows of the workbook: shift tonnes plus ore
 * sent to stockpiles, keyed like the resource file's locations ("cn1740-24"). Rows without a
 * block number (stockpiles such as OSP8) are skipped.
 */
export function actualTotals(rows: readonly ActualRow[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) {
    const ref = parseActualName(r.name);
    if (!ref) continue;
    const key = siteKey(ref);
    out.set(key, (out.get(key) ?? 0) + r.tonnes + r.stockpileTonnes);
  }
  return out;
}
