import type { IsoDate } from '../../types/domain';
import type { ParsedOrderFact } from '../actuals';
import { actualKey, displayName } from './blockKey';
import {
  DEVIATION_CATEGORIES,
  SECTION_CATEGORIES,
  type DeviationCategory,
  type DeviationSection,
  type DeviationRow,
  type ParsedPlan,
  type Triple,
} from './types';

const EPS = 1e-6;

const emptyValues = (): Record<DeviationCategory, Triple> => ({
  crusher: { order: 0, plan: 0, fact: 0 },
  osp: { order: 0, plan: 0, fact: 0 },
  overburden: { order: 0, plan: 0, fact: 0 },
});

function addInto(
  target: Record<DeviationCategory, Triple>,
  src: Record<DeviationCategory, Triple>,
) {
  for (const c of DEVIATION_CATEGORIES) {
    target[c].order += src[c].order;
    target[c].plan += src[c].plan;
    target[c].fact += src[c].fact;
  }
}

/** Copy of `v` keeping only the columns of one section (others zero). */
function onlySection(
  v: Record<DeviationCategory, Triple>,
  section: DeviationSection,
): Record<DeviationCategory, Triple> {
  const out = emptyValues();
  for (const c of SECTION_CATEGORIES[section]) out[c] = { ...v[c] };
  return out;
}

const isZero = (v: Record<DeviationCategory, Triple>) =>
  DEVIATION_CATEGORIES.every(
    (c) => Math.abs(v[c].order) < EPS && Math.abs(v[c].plan) < EPS && Math.abs(v[c].fact) < EPS,
  );

/**
 * Deviation table over the plan period. Per date: the ore rows (crusher and OSP columns) with
 * their subtotal, then the overburden rows with theirs; a grand total last. Order and fact come
 * from the plan/actual workbook, plan from the weekly plan.
 * Order/fact rows outside the plan period are ignored; all-zero block rows are dropped.
 */
export function computeDeviation(plan: ParsedPlan, orderFact: ParsedOrderFact): DeviationRow[] {
  const period = new Set(plan.dates);
  const factDates = new Set(orderFact.factDates);
  /** date → block key → values */
  const byDate = new Map<IsoDate, Map<string, Record<DeviationCategory, Triple>>>();
  const names = new Map<string, string>();
  const cell = (date: IsoDate, key: string) => {
    const blocks = byDate.get(date) ?? new Map<string, Record<DeviationCategory, Triple>>();
    byDate.set(date, blocks);
    const v = blocks.get(key) ?? emptyValues();
    blocks.set(key, v);
    return v;
  };

  for (const e of plan.entries) {
    cell(e.date, e.key)[e.category].plan += e.tonnes;
  }
  for (const r of orderFact.rows) {
    if (!period.has(r.date)) continue;
    const key = actualKey(r.name);
    if (!names.has(key)) names.set(key, r.name);
    const v = cell(r.date, key);
    const field = r.kind === 'order' ? 'order' : 'fact';
    v.crusher[field] += r.crusher;
    v.osp[field] += r.osp;
    v.overburden[field] += r.overburden;
  }

  const rows: DeviationRow[] = [];
  const total = emptyValues();
  const totalToDate = emptyValues();
  for (const date of plan.dates) {
    const blocks = [...(byDate.get(date) ?? new Map<string, Record<DeviationCategory, Triple>>())]
      .map(([key, values]) => ({ name: names.get(key) ?? displayName(key), values }))
      .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
    const hasFact = factDates.has(date);
    // Each block is split by section: its ore columns go to the ore rows, its overburden
    // column to the overburden rows (a block with both appears in both sections).
    for (const section of ['ore', 'overburden'] as const satisfies readonly DeviationSection[]) {
      const subtotal = emptyValues();
      rows.push({
        key: `${date}|${section}|section`,
        kind: 'section',
        section,
        date,
        block: '',
        values: emptyValues(),
        hasFact,
      });
      for (const b of blocks) {
        const values = onlySection(b.values, section);
        if (isZero(values)) continue;
        rows.push({
          key: `${date}|${section}|${b.name}`,
          kind: 'block',
          section,
          date,
          block: b.name,
          values,
          hasFact,
        });
        addInto(subtotal, values);
      }
      rows.push({
        key: `${date}|${section}|subtotal`,
        kind: 'subtotal',
        section,
        date,
        block: '',
        values: subtotal,
        hasFact,
      });
      addInto(total, subtotal);
      if (hasFact) addInto(totalToDate, subtotal);
    }
  }
  rows.push({
    key: 'total',
    kind: 'total',
    date: null,
    block: '',
    values: total,
    hasFact: plan.dates.some((d) => factDates.has(d)),
    execRef: totalToDate,
  });
  return rows;
}

/** Execution of a reference (order or plan): signed difference and fact / reference. */
export function execution(fact: number, ref: number): Execution {
  return { diff: fact - ref, ratio: ref > EPS ? fact / ref : null };
}

export interface Execution {
  diff: number;
  ratio: number | null;
}

/** What one category group of a row shows (shared by the table and the Excel export). */
export interface CategoryView {
  order: number;
  plan: number;
  /** Null when the date has no actual data yet. */
  fact: number | null;
  /** Null when there is no fact yet or nothing to compare (reference and fact both 0). */
  execOrder: Execution | null;
  execPlan: Execution | null;
}

export function categoryView(row: DeviationRow, c: DeviationCategory): CategoryView {
  const v = row.values[c];
  const ref = row.execRef?.[c] ?? v;
  const exec = (r: number): Execution | null =>
    !row.hasFact || (Math.abs(r) < EPS && Math.abs(v.fact) < EPS) ? null : execution(v.fact, r);
  return {
    order: v.order,
    plan: v.plan,
    fact: row.hasFact ? v.fact : null,
    execOrder: exec(ref.order),
    execPlan: exec(ref.plan),
  };
}

/** Whether row `row` shows category `c` (a section row leaves the other section's columns empty). */
export function shows(row: DeviationRow, c: DeviationCategory): boolean {
  if (row.kind === 'section') return false;
  return row.section === undefined || SECTION_CATEGORIES[row.section].includes(c);
}

/** Block-column label of a row: block name, or the section subtotal label. */
export function rowLabelKey(
  row: DeviationRow,
):
  | 'deviation.section.ore'
  | 'deviation.section.overburden'
  | 'deviation.subtotal.ore'
  | 'deviation.subtotal.overburden'
  | null {
  if (row.kind === 'section')
    return row.section === 'overburden' ? 'deviation.section.overburden' : 'deviation.section.ore';
  if (row.kind !== 'subtotal') return null;
  return row.section === 'overburden' ? 'deviation.subtotal.overburden' : 'deviation.subtotal.ore';
}
