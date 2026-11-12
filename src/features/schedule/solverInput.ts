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
import { hashValue } from '../../shared/utils/hash';
import { ROW_DESCRIPTORS } from './rowDescriptors';
import { resolveTargets } from './targets';

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
    blocks: blocks.map((b) => {
      const input = inputs[b.id];
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
      releaseThreshold: settings.releaseThreshold,
      releaseEpsilon: settings.releaseEpsilon,
      roundingStep: settings.roundingStep,
      timeLimitSec: settings.timeLimitSec,
      mipRelGap: settings.mipRelGap,
      rollingHorizonAbove: settings.rollingHorizonAbove,
    },
  };
  return { ...payload, inputHash: hashValue(payload) };
}
