import type { Settings } from '../../types/domain';

export const DEFAULT_SETTINGS: Settings = {
  rows: {
    tonnage: { tolerance: 0.1, weightOut: 1000, weightIn: 1 },
    cu: { tolerance: 0.1, weightOut: 500, weightIn: 0.5 },
    mo: { tolerance: 0.1, weightOut: 250, weightIn: 0.25 },
    // Hard capacity: tolerance and weights are unused but kept for a uniform shape.
    wasteMax: { tolerance: 0, weightOut: 0, weightIn: 0 },
  },
  oreCutoffEq: 0.25,
  wasteCostPerTonne: 1e-6,
  earlyDayPreference: 0.5,
  releaseThreshold: 15000,
  releaseEpsilon: 1,
  roundingStep: 10,
  timeLimitSec: 30,
  mipRelGap: 0.01,
  rollingHorizonAbove: 20000,
  amberThreshold: 0.07,
};
