import type { Block, BlockId, Schedule } from '../../types/domain';
import { INFO_ROWS, ROW_DESCRIPTORS, type DayResult } from '../schedule';
import { t } from '../../shared/i18n/t';

export type SheetCell = string | number | null;
export type Sheet = SheetCell[][];

const round = (v: number | null, dp: number): number | null =>
  v === null ? null : Math.round(v * 10 ** dp) / 10 ** dp;
const dpFor = (unit: string) => (unit === 't' ? 0 : unit === '%' ? 4 : 2);

/** Build export sheets: summary (targets, achieved, deviation), allocation and end balances. */
export function scheduleToSheets(
  schedule: Schedule,
  results: readonly DayResult[],
  blocks: readonly Block[],
): { summary: Sheet; allocation: Sheet; balances: Sheet } {
  const dates = schedule.days.map((d) => d.date);
  const header: Sheet[number] = [t('export.row'), t('export.unit'), ...dates];

  const summary: Sheet = [header];
  for (const desc of ROW_DESCRIPTORS) {
    const label = t(desc.labelKey);
    summary.push([
      `${label} — ${t('export.target')}`,
      desc.unit,
      ...results.map((r) => r.rows[desc.key].target),
    ]);
    summary.push([
      `${label} — ${t('export.achieved')}`,
      desc.unit,
      ...results.map((r) => round(r.rows[desc.key].value, dpFor(desc.unit))),
    ]);
    if (desc.kind === 'target') {
      summary.push([
        `${label} — ${t('export.deviation')}`,
        '%',
        ...results.map((r) => {
          const dev = r.rows[desc.key].deviation;
          return dev === null ? null : round(dev * 100, 2);
        }),
      ]);
    }
  }
  for (const info of INFO_ROWS) {
    summary.push([
      t(info.labelKey),
      info.unit,
      ...results.map((r) => round(r.info[info.key] ?? null, dpFor(info.unit))),
    ]);
  }
  summary.push([
    t('export.status'),
    '',
    ...results.map((r) => {
      const bad = Object.values(r.rows)
        .filter((x) => x.status === 'bad')
        .map((x) => x.key);
      return bad.length === 0 ? t('export.ok') : `${t('export.outside')}: ${bad.join(', ')}`;
    }),
  ]);

  // Allocation and end-of-day balance per block (blocks used at least once).
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const used: BlockId[] = [];
  const seen = new Set<BlockId>();
  const cls = new Map<BlockId, string>();
  for (const d of schedule.days) {
    for (const a of d.allocations) {
      cls.set(a.blockId, a.cls);
      if (!seen.has(a.blockId)) {
        seen.add(a.blockId);
        used.push(a.blockId);
      }
    }
  }
  used.sort((a, b) => (cls.get(a) === cls.get(b) ? 0 : cls.get(a) === 'ore' ? -1 : 1));

  const blockHeader: Sheet[number] = [
    t('export.block'),
    t('export.class'),
    t('field.material'),
    ...dates,
  ];
  const allocation: Sheet = [blockHeader];
  const balances: Sheet = [blockHeader];
  for (const id of used) {
    const meta = [
      id,
      t(cls.get(id) === 'waste' ? 'class.waste' : 'class.ore'),
      byId.get(id)?.material ?? '',
    ];
    const tonnes: SheetCell[] = [];
    const bal: SheetCell[] = [];
    let last: number | null = null;
    for (const d of schedule.days) {
      const a = d.allocations.find((x) => x.blockId === id);
      tonnes.push(a ? round(a.tonnes, 3) : null);
      if (a) last = a.endBalance;
      bal.push(last === null ? null : round(last, 3));
    }
    allocation.push([...meta, ...tonnes]);
    balances.push([...meta, ...bal]);
  }
  return { summary, allocation, balances };
}
