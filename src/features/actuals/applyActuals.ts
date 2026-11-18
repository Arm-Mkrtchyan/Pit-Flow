import type { Block, BlockId, BlockUserInput, GradeField, IsoDate } from '../../types/domain';
import { classifyBlock } from '../../shared/utils/blockClass';
import { parseActualName, siteKey, siteKeyNoPit } from '../../shared/utils/site';
import {
  ACTUAL_GRADE_FIELDS,
  type ActualAggregate,
  type ActualMatch,
  type ActualRow,
} from './types';

const EPS = 1e-6;

/**
 * Total actual extraction per block name for rows dated strictly before `before`.
 * Grades are tonnage-weighted averages:  ḡ = Σ(tonnes_d × grade_d) / Σ tonnes_d
 * (per grade, over the rows that report that grade).
 */
export function aggregateActuals(
  rows: readonly ActualRow[],
  before: IsoDate,
): { aggregates: ActualAggregate[]; rowsUsed: number; rowsAfter: number } {
  const acc = new Map<
    string,
    {
      name: string;
      tonnes: number;
      sum: Partial<Record<string, number>>;
      wt: Partial<Record<string, number>>;
      days: Set<string>;
      first: IsoDate;
      last: IsoDate;
    }
  >();
  let rowsUsed = 0;
  let rowsAfter = 0;
  for (const r of rows) {
    // Rows with only stockpile tonnes don't deplete blocks here (only the shift columns do).
    if (r.tonnes <= 0) continue;
    if (r.date >= before) {
      rowsAfter++;
      continue;
    }
    rowsUsed++;
    const key = r.name.toUpperCase();
    const a = acc.get(key) ?? {
      name: r.name,
      tonnes: 0,
      sum: {},
      wt: {},
      days: new Set<string>(),
      first: r.date,
      last: r.date,
    };
    a.tonnes += r.tonnes;
    for (const f of ACTUAL_GRADE_FIELDS) {
      const g = r.grades[f];
      if (g === undefined) continue;
      a.sum[f] = (a.sum[f] ?? 0) + r.tonnes * g;
      a.wt[f] = (a.wt[f] ?? 0) + r.tonnes;
    }
    a.days.add(r.date);
    if (r.date < a.first) a.first = r.date;
    if (r.date > a.last) a.last = r.date;
    acc.set(key, a);
  }
  const aggregates = [...acc.entries()]
    .map(([, a]): ActualAggregate => {
      const grades: ActualAggregate['grades'] = {};
      for (const f of ACTUAL_GRADE_FIELDS) {
        const w = a.wt[f];
        const s = a.sum[f];
        if (w !== undefined && w > 0 && s !== undefined) grades[f] = s / w;
      }
      return {
        name: a.name,
        tonnes: a.tonnes,
        grades,
        days: a.days.size,
        firstDate: a.first,
        lastDate: a.last,
      };
    })
    .sort((x, y) => x.name.localeCompare(y.name));
  return { aggregates, rowsUsed, rowsAfter };
}

export interface ApplyResult {
  userInputs: Record<BlockId, BlockUserInput>;
  matches: ActualMatch[];
  /** For the undoable history entry. */
  before: Record<BlockId, number>;
  taken: Record<BlockId, number>;
  beforeInputs: Record<BlockId, BlockUserInput>;
}

/**
 * Apply aggregated actuals to the block list.
 * - Matches Excel names (CN1740-17) to blocks by site key; block files without a pit code
 *   match on elevation-number when that is unambiguous.
 * - Splits a site's extracted tonnes across its ore rows in proportion to their file weight.
 * - Always recalculates from the file weight and grades (re-importing never double-counts).
 * - Remaining grade by mass balance: g' = (W·g − E·ḡ) / (W − E), clamped at 0.
 * - Blocks not in the actuals are left unchanged.
 */
export function applyActuals(
  blocks: readonly Block[],
  inputs: Readonly<Record<BlockId, BlockUserInput>>,
  aggregates: readonly ActualAggregate[],
  before: IsoDate,
  oreCutoffEq: number,
): ApplyResult {
  const byKey = new Map<string, Block[]>();
  const byNoPit = new Map<string, Block[]>();
  for (const b of blocks) {
    if (!b.siteKey) continue;
    const list = byKey.get(b.siteKey) ?? [];
    list.push(b);
    byKey.set(b.siteKey, list);
    if (/^\d/.test(b.siteKey)) {
      const l2 = byNoPit.get(b.siteKey) ?? [];
      l2.push(b);
      byNoPit.set(b.siteKey, l2);
    }
  }
  // Excel names per pit-less key, to detect ambiguity (CN1875-27 vs SS1875-27).
  const namesByNoPit = new Map<string, string[]>();
  for (const a of aggregates) {
    const ref = parseActualName(a.name);
    if (!ref) continue;
    const k = siteKeyNoPit(ref);
    namesByNoPit.set(k, [...(namesByNoPit.get(k) ?? []), a.name]);
  }

  const userInputs: Record<BlockId, BlockUserInput> = { ...inputs };
  const result: ApplyResult = { userInputs, matches: [], before: {}, taken: {}, beforeInputs: {} };

  for (const agg of aggregates) {
    const ref = parseActualName(agg.name);
    if (!ref) {
      result.matches.push({ aggregate: agg, status: 'unmatched', blocks: [], overrun: 0 });
      continue;
    }
    let matched = byKey.get(siteKey(ref)) ?? [];
    if (matched.length === 0) {
      const noPit = siteKeyNoPit(ref);
      const sameNumber = namesByNoPit.get(noPit) ?? [];
      const loose = byNoPit.get(noPit) ?? [];
      if (loose.length > 0 && sameNumber.length > 1) {
        result.matches.push({
          aggregate: agg,
          status: 'ambiguous',
          blocks: [],
          overrun: 0,
          candidates: sameNumber,
        });
        continue;
      }
      matched = loose;
    }
    if (matched.length === 0) {
      result.matches.push({ aggregate: agg, status: 'unmatched', blocks: [], overrun: 0 });
      continue;
    }
    const ore = matched.filter((b) => classifyBlock(b, oreCutoffEq) === 'ore');
    const W = ore.reduce((s, b) => s + b.weight, 0);
    if (ore.length === 0 || W <= EPS) {
      result.matches.push({ aggregate: agg, status: 'noOre', blocks: [], overrun: 0 });
      continue;
    }

    const extracted = Math.min(agg.tonnes, W);
    const overrun = Math.max(agg.tonnes - W, 0);
    const match: ActualMatch = {
      aggregate: agg,
      status: overrun > EPS ? 'overrun' : 'applied',
      blocks: [],
      overrun,
    };

    // Model grade of the site's ore (weight-weighted). Each row's extracted grade is its own grade
    // scaled by ḡ / Ḡ, so rows keep their relative grades and the site total matches ḡ exactly:
    // Σ shareᵢ·gᵢ·(ḡ/Ḡ) = E·ḡ  (because shareᵢ ∝ wᵢ).
    const modelGrade = (f: 'cu' | 'mo' | 'as' | 'pb'): number | undefined => {
      const rows = ore.filter((b) => b[f] !== undefined);
      const w = rows.reduce((s, b) => s + b.weight, 0);
      return w > 0 ? rows.reduce((s, b) => s + b.weight * (b[f] ?? 0), 0) / w : undefined;
    };

    for (const b of ore) {
      const prev = inputs[b.id] ?? { remaining: b.weight, dependsOn: [] };
      const share = (extracted * b.weight) / W;
      const remainingRaw = b.weight - share;
      const remaining = remainingRaw <= EPS ? 0 : remainingRaw;
      const clamped: string[] = [];
      const grades: Partial<Record<GradeField, number>> = {};

      if (remaining > 0) {
        // Mass balance per grade; a grade missing from the actuals keeps the block grade.
        const balance = (f: 'cu' | 'mo' | 'as' | 'pb'): number | undefined => {
          const g = b[f];
          if (g === undefined) return undefined;
          const G = modelGrade(f);
          const actual = agg.grades[f];
          const gx = actual !== undefined && G !== undefined && G > EPS ? g * (actual / G) : g;
          const v = (b.weight * g - share * gx) / remaining;
          if (v < 0) {
            clamped.push(f);
            return 0;
          }
          return v;
        };
        const cu = balance('cu') ?? b.cu;
        const mo = balance('mo') ?? b.mo;
        grades.cu = cu;
        grades.mo = mo;
        const as = balance('as');
        const pb = balance('pb');
        if (as !== undefined) grades.as = as;
        if (pb !== undefined) grades.pb = pb;
        // Cu-eq is not in the actuals: keep the block's own Cu→Cu-eq relation (eq = cu + k·mo).
        const k = b.mo > EPS ? (b.eq - b.cu) / b.mo : 0;
        grades.eq = Math.max(b.mo > EPS ? cu + k * mo : b.eq + (cu - b.cu), 0);
      }

      result.beforeInputs[b.id] = prev;
      result.before[b.id] = prev.remaining;
      result.taken[b.id] = share;
      userInputs[b.id] = {
        remaining,
        dependsOn: prev.dependsOn,
        ...(remaining > 0 ? { grades } : {}),
        actuals: { before, tonnes: share, overrun: (overrun * b.weight) / W },
      };
      match.blocks.push({
        id: b.id,
        share,
        remaining,
        gradesBefore: { cu: b.cu, mo: b.mo, eq: b.eq },
        gradesAfter: remaining > 0 ? { cu: grades.cu, mo: grades.mo, eq: grades.eq } : {},
        clampedGrades: clamped,
        // Less than 10 % of the block left and Cu changed by more than half.
        unstable:
          remaining > 0 &&
          remaining < 0.1 * b.weight &&
          Math.abs((grades.cu ?? b.cu) - b.cu) > 0.5 * Math.max(b.cu, EPS),
      });
    }
    result.matches.push(match);
  }
  return result;
}
