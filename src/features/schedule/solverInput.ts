import type {
  Block,
  BlockId,
  BlockUserInput,
  DayTargets,
  IsoDate,
  Settings,
} from '../../types/domain';
import type { SolverInput } from '../../types/solver';
import { classifyBlock } from '../../shared/utils/blockClass';
import { effectiveBlock } from '../../shared/utils/effectiveBlock';
import { hashValue } from '../../shared/utils/hash';
import { ROW_DESCRIPTORS } from './rowDescriptors';
import { resolveTargets } from './targets';

/**
 * Daily limit the solver uses for a block: the lower of its own limit and the default limit
 * per block from settings (0 = none). Missing = no limit.
 */
export function effectiveDailyMax(own: number | undefined, globalMax: number): number | undefined {
  const g = globalMax > 0 ? globalMax : undefined;
  if (own === undefined) return g;
  return g === undefined ? own : Math.min(own, g);
}

/** Assemble the serialisable solver payload from app state. */
export function buildSolverInput(
  blocks: readonly Block[],
  inputs: Readonly<Record<BlockId, BlockUserInput>>,
  days: readonly IsoDate[],
  targets: DayTargets,
  settings: Settings,
): SolverInput {
  const payload: Omit<SolverInput, 'inputHash'> = {
    days: [...days],
    blocks: blocks.map((fileBlock) => {
      const input = inputs[fileBlock.id];
      // Grades of the remaining material (recalculated from actuals when available).
      const b = effectiveBlock(fileBlock, input);
      return {
        id: b.id,
        cu: b.cu,
        mo: b.mo,
        as: b.as,
        pb: b.pb,
        eq: b.eq,
        cls: classifyBlock(b, settings.oreCutoffEq),
        remaining: input?.remaining ?? b.weight,
        dependsOn: input?.dependsOn ?? [],
        dailyMax: effectiveDailyMax(input?.dailyMax, settings.maxDailyPerBlock),
        dayOverrides: input?.dayOverrides,
      };
    }),
    rows: ROW_DESCRIPTORS.map(({ key, kind, basis, pool, hard, blockField }) => ({
      key,
      kind,
      basis,
      pool,
      hard,
      blockField,
    })),
    targets: resolveTargets(days, targets),
    settings: {
      rows: settings.rows,
      wasteCostPerTonne: settings.wasteCostPerTonne,
      earlyDayPreference: settings.earlyDayPreference,
      aimExactTarget: settings.aimExactTarget,
      releaseThreshold: settings.releaseThreshold,
      minDailyTonnes: settings.minDailyTonnes,
      releaseEpsilon: settings.releaseEpsilon,
      roundingStep: settings.roundingStep,
      timeLimitSec: settings.timeLimitSec,
      mipRelGap: settings.mipRelGap,
      rollingHorizonAbove: settings.rollingHorizonAbove,
    },
  };
  return { ...payload, inputHash: hashValue(payload) };
}
