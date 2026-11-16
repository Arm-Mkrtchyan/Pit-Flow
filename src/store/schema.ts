import { z } from 'zod';

/** zod schema for the persisted state (current version). Validated on every load. */

const finite = z.number().finite();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const rowKey = z.enum(['tonnage', 'cu', 'mo', 'wasteMax']);
const blockClass = z.enum(['ore', 'waste']);
const fieldKey = z.enum([
  'elevation',
  'group',
  'material',
  'volume',
  'weight',
  'cu',
  'mo',
  'as',
  'pb',
  'eq',
  'density',
  'site',
  'miningStart',
  'miningEnd',
]);

const block = z.object({
  id: z.string().min(1),
  elevation: finite,
  group: finite,
  material: z.string().min(1),
  volume: finite.optional(),
  weight: finite.positive(),
  cu: finite,
  mo: finite,
  as: finite.optional(),
  pb: finite.optional(),
  eq: finite,
  density: finite.optional(),
  sourceRow: z.number().int(),
  site: z.string().optional(),
  siteKey: z.string().optional(),
  miningStart: isoDate.optional(),
  miningEnd: isoDate.optional(),
});

const gradeField = z.enum(['cu', 'mo', 'as', 'pb', 'eq']);

const userInput = z.object({
  remaining: finite.min(0),
  dependsOn: z.array(z.string()),
  grades: z.record(gradeField, finite.min(0)).optional(),
  actuals: z.object({ before: isoDate, tonnes: finite, overrun: finite }).optional(),
});

const rowSettings = z.object({
  tolerance: finite.min(0),
  weightOut: finite.min(0),
  weightIn: finite.min(0),
});

export const settingsSchema = z.object({
  rows: z.record(rowKey, rowSettings),
  oreCutoffEq: finite.min(0),
  wasteCostPerTonne: finite.min(0),
  earlyDayPreference: finite.min(0),
  aimExactTarget: z.boolean(),
  releaseThreshold: finite.min(0),
  releaseEpsilon: finite.min(0),
  roundingStep: z.union([z.literal(1), z.literal(10), z.literal(100)]),
  timeLimitSec: finite.positive(),
  mipRelGap: finite.min(0),
  rollingHorizonAbove: finite.positive(),
  amberThreshold: finite.min(0),
  lastColumnMapping: z.record(z.string(), fieldKey).optional(),
});

const allocation = z.object({
  blockId: z.string(),
  cls: blockClass,
  tonnes: finite,
  endBalance: finite,
});

const schedule = z.object({
  days: z.array(z.object({ date: isoDate, allocations: z.array(allocation) })),
  status: z.enum(['optimal', 'time_limit', 'rolling_horizon', 'error']),
  mipGap: finite.optional(),
  solveMs: finite,
  inputHash: z.string(),
  solvedAt: z.string(),
});

const warning = z.discriminatedUnion('code', [
  z.object({ code: z.literal('timeLimit') }),
  z.object({ code: z.literal('timeLimitRolling') }),
  z.object({ code: z.literal('fullModelFailed'), status: z.string() }),
  z.object({ code: z.literal('tooLarge'), xVars: finite, binaries: finite }),
]);

const acceptedEntry = z.object({
  id: z.string(),
  acceptedAt: z.string(),
  range: z.tuple([isoDate, isoDate]),
  kind: z.enum(['accept', 'actuals']).optional(),
  before: z.record(z.string(), finite),
  taken: z.record(z.string(), finite),
  beforeInputs: z.record(z.string(), userInput).optional(),
});

const clock = z.string().regex(/^\d{1,2}:\d{2}$/);

const drilling = z.object({
  range: z.tuple([isoDate, isoDate]).nullable(),
  rigs: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      model: z.string().optional(),
      hoursPerDay: finite.positive().max(24).optional(),
      byPosition: z.record(
        z.string(),
        z.object({ blastIndex: finite.positive(), productivity: finite.positive() }),
      ),
    }),
  ),
  assignments: z.record(
    z.string(),
    z.array(
      z.object({
        rowId: z.string().min(1),
        rigId: z.string().nullable(),
        start: isoDate.nullable(),
        drilledLm: finite.min(0),
      }),
    ),
  ),
  settings: z.object({
    loadMinutesPerHole: finite.min(0),
    blastTime: clock,
    shiftStart: clock,
    hoursPerDay: finite.positive().max(24),
  }),
});

export const persistedSchema = z.object({
  blocks: z.array(block),
  userInputs: z.record(z.string(), userInput),
  plan: z.object({
    range: z.tuple([isoDate, isoDate]).nullable(),
    targets: z.record(rowKey, z.record(isoDate, finite)),
  }),
  settings: settingsSchema,
  solution: z.object({
    schedule: schedule.nullable(),
    stale: z.boolean(),
    warnings: z.array(warning),
  }),
  history: z.array(acceptedEntry),
  language: z.enum(['en', 'ru', 'hy']),
  drilling,
});

export type PersistedState = z.infer<typeof persistedSchema>;
