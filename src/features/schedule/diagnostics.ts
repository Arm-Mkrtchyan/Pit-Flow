import type {
  Block,
  BlockClass,
  BlockId,
  BlockUserInput,
  DayTargets,
  IsoDate,
  RowDescriptor,
  RowKey,
  Schedule,
  Settings,
} from '../../types/domain';
import { t } from '../../shared/i18n/t';
import { fmtByUnit, fmtTonnes } from '../../shared/format';
import { classifyBlock } from '../../shared/utils/blockClass';
import { INFO_ROWS } from './resultRows';
import { ROW_DESCRIPTORS } from './rowDescriptors';
import { resolveTarget } from './targets';

export type CellStatus = 'ok' | 'warn' | 'bad' | 'na';

export interface RowResult {
  key: RowKey;
  target: number;
  value: number | null;
  /** (value − target) / target; null when not meaningful. */
  deviation: number | null;
  status: CellStatus;
  band: [number, number] | null;
  reason?: string;
}

export interface DayResult {
  date: IsoDate;
  rows: Record<RowKey, RowResult>;
  /** Tonnage-weighted info values over ore (null when no ore). */
  info: Record<string, number | null>;
  oreTonnes: number;
  wasteTonnes: number;
}

const EPS = 1e-6;

interface DayContext {
  start: Map<BlockId, number>;
  taken: Map<BlockId, number>;
}

/**
 * Derive achieved values, deviations, colour status and reasons for each scheduled day.
 * Pure; never persisted. Start balances are the current user remaining stock (valid while the
 * solution is not stale).
 */
export function computeResults(
  schedule: Schedule,
  blocks: readonly Block[],
  inputs: Readonly<Record<BlockId, BlockUserInput>>,
  targets: DayTargets,
  settings: Settings,
): DayResult[] {
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const cls = new Map<BlockId, BlockClass>(
    blocks.map((b) => [b.id, classifyBlock(b, settings.oreCutoffEq)]),
  );
  const balance = new Map<BlockId, number>(
    blocks.map((b) => [b.id, inputs[b.id]?.remaining ?? b.weight]),
  );

  return schedule.days.map((day) => {
    const ctx: DayContext = { start: new Map(balance), taken: new Map() };
    for (const a of day.allocations) {
      ctx.taken.set(a.blockId, (ctx.taken.get(a.blockId) ?? 0) + a.tonnes);
      balance.set(a.blockId, Math.max((balance.get(a.blockId) ?? 0) - a.tonnes, 0));
    }

    const poolTonnes = (pool: BlockClass) =>
      day.allocations.filter((a) => a.cls === pool).reduce((s, a) => s + a.tonnes, 0);
    const weighted = (pool: BlockClass, field: 'cu' | 'mo' | 'as' | 'pb' | 'eq') => {
      let tonnes = 0;
      let sum = 0;
      for (const a of day.allocations) {
        const b = byId.get(a.blockId);
        const v = b?.[field];
        if (a.cls !== pool || v === undefined) continue;
        tonnes += a.tonnes;
        sum += a.tonnes * v;
      }
      return tonnes > EPS ? sum / tonnes : null;
    };

    const rows = {} as Record<RowKey, RowResult>;
    for (const desc of ROW_DESCRIPTORS) {
      const target = resolveTarget(desc, targets, day.date);
      const value =
        desc.basis === 'tonnage'
          ? poolTonnes(desc.pool)
          : desc.blockField
            ? weighted(desc.pool, desc.blockField)
            : null;
      // Rounding each allocation to the rounding step can move a band-edge value slightly out.
      const allocCount = day.allocations.filter((a) => a.cls === desc.pool).length;
      rows[desc.key] = evaluateRow(desc, target, value, settings, allocCount, () =>
        explain(desc, target, value, ctx, byId, cls, inputs, settings),
      );
    }

    const info: Record<string, number | null> = {};
    for (const r of INFO_ROWS) info[r.key] = weighted('ore', r.field);

    return {
      date: day.date,
      rows,
      info,
      oreTonnes: poolTonnes('ore'),
      wasteTonnes: poolTonnes('waste'),
    };
  });
}

function evaluateRow(
  desc: RowDescriptor,
  target: number,
  value: number | null,
  settings: Settings,
  allocCount: number,
  reason: () => string,
): RowResult {
  const base = { key: desc.key, target, value };
  if (desc.kind === 'limit') {
    // Allow rounding slack on hard limits.
    const over = value !== null && value > target + settings.roundingStep;
    return {
      ...base,
      deviation: null,
      band: [0, target],
      status: value === null ? 'na' : over ? 'bad' : 'ok',
      reason: over ? reason() : undefined,
    };
  }
  if (target <= 0) {
    if (desc.basis === 'grade') return { ...base, deviation: null, band: null, status: 'na' };
    const bad = (value ?? 0) > settings.roundingStep;
    return { ...base, deviation: null, band: [0, 0], status: bad ? 'warn' : 'ok' };
  }
  const tol = settings.rows[desc.key].tolerance;
  const band: [number, number] = [target * (1 - tol), target * (1 + tol)];
  if (value === null) {
    return { ...base, deviation: null, band, status: 'bad', reason: t('reason.noOre') };
  }
  const deviation = (value - target) / target;
  // Rounding slack: tonnage rows ±(step/2 per allocation); grade rows a small relative margin.
  const slack =
    desc.basis === 'tonnage'
      ? (settings.roundingStep * Math.max(allocCount, 1)) / 2 / target
      : 0.002;
  const inside = Math.abs(deviation) <= tol + slack;
  const status: CellStatus = !inside
    ? 'bad'
    : Math.abs(deviation) > settings.amberThreshold
      ? 'warn'
      : 'ok';
  return { ...base, deviation, band, status, reason: inside ? undefined : reason() };
}

/** Explain why a row ended outside its band (best-effort, based on start-of-day availability). */
function explain(
  desc: RowDescriptor,
  target: number,
  value: number | null,
  ctx: DayContext,
  byId: ReadonlyMap<BlockId, Block>,
  cls: ReadonlyMap<BlockId, BlockClass>,
  inputs: Readonly<Record<BlockId, BlockUserInput>>,
  settings: Settings,
): string {
  const tol = settings.rows[desc.key].tolerance;
  const R = settings.releaseThreshold;
  const parts: string[] = [];

  // Blocks of this pool with stock at the start of the day, split into usable / locked.
  const available: Block[] = [];
  const lockedBy = new Set<BlockId>();
  let locked = 0;
  for (const [id, bal] of ctx.start) {
    const b = byId.get(id);
    if (!b || bal <= EPS || cls.get(id) !== desc.pool) continue;
    const blockingParents = (inputs[id]?.dependsOn ?? []).filter(
      (p) => (ctx.start.get(p) ?? 0) >= R && (ctx.start.get(p) ?? 0) > EPS,
    );
    if (blockingParents.length > 0) {
      locked++;
      blockingParents.forEach((p) => lockedBy.add(p));
    } else {
      available.push(b);
    }
  }
  const availableTonnes = available.reduce((s, b) => s + (ctx.start.get(b.id) ?? 0), 0);

  if (desc.kind === 'limit') {
    parts.push(
      t('reason.limitExceeded', {
        value: fmtByUnit(value, desc.unit),
        cap: fmtByUnit(target, desc.unit),
      }),
    );
  } else if (desc.basis === 'tonnage') {
    const min = target * (1 - tol);
    if ((value ?? 0) < min) {
      if (availableTonnes < min) {
        parts.push(
          t('reason.notEnoughStock', {
            available: fmtTonnes(availableTonnes),
            min: fmtTonnes(min),
          }),
        );
      } else {
        parts.push(t('reason.tradeOffGrades'));
      }
    } else {
      parts.push(t('reason.tradeOffGrades'));
    }
  } else if (desc.blockField) {
    const field = desc.blockField;
    const graded = available.filter((b) => b[field] !== undefined);
    const under = (value ?? 0) < target * (1 - tol);
    if (graded.length === 0) {
      parts.push(t('reason.noOre'));
    } else if (under) {
      const best = graded.reduce((m, b) => ((b[field] ?? 0) > (m[field] ?? 0) ? b : m));
      const min = target * (1 - tol);
      parts.push(
        (best[field] ?? 0) < min
          ? t('reason.gradeTooLow', {
              id: best.id,
              grade: fmtByUnit(best[field], desc.unit),
              min: fmtByUnit(min, desc.unit),
            })
          : t('reason.tradeOffPriority'),
      );
    } else {
      const worst = graded.reduce((m, b) => ((b[field] ?? 0) < (m[field] ?? 0) ? b : m));
      const max = target * (1 + tol);
      parts.push(
        (worst[field] ?? 0) > max
          ? t('reason.gradeTooHigh', {
              id: worst.id,
              grade: fmtByUnit(worst[field], desc.unit),
              max: fmtByUnit(max, desc.unit),
            })
          : t('reason.tradeOffPriority'),
      );
    }
  }

  if (locked > 0) {
    const parents = [...lockedBy];
    const wasteParents = parents.filter((p) => cls.get(p) === 'waste');
    parts.push(
      t('reason.locked', {
        count: locked,
        parents: parents.slice(0, 4).join(', ') + (parents.length > 4 ? '…' : ''),
      }),
    );
    if (wasteParents.length > 0)
      parts.push(t('reason.lockedByWaste', { parents: wasteParents.slice(0, 4).join(', ') }));
  }
  return parts.join(' ');
}
