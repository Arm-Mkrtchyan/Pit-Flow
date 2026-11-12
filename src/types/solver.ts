import type {
  Block,
  BlockClass,
  BlockId,
  IsoDate,
  RowDescriptor,
  RowKey,
  Schedule,
  Settings,
} from './domain';

export interface SolverBlock extends Pick<Block, 'id' | 'cu' | 'mo' | 'as' | 'pb' | 'eq'> {
  cls: BlockClass;
  remaining: number;
  dependsOn: BlockId[];
}

/** The parts of a RowDescriptor the model builder needs (keeps the solver UI-free). */
export type SolverRowSpec = Pick<
  RowDescriptor,
  'key' | 'kind' | 'basis' | 'pool' | 'hard' | 'blockField'
>;

export type SolverSettings = Pick<
  Settings,
  | 'rows'
  | 'wasteCostPerTonne'
  | 'earlyDayPreference'
  | 'releaseThreshold'
  | 'releaseEpsilon'
  | 'roundingStep'
  | 'timeLimitSec'
  | 'mipRelGap'
  | 'rollingHorizonAbove'
>;

/** Serialisable payload posted to the solver worker. */
export interface SolverInput {
  days: IsoDate[];
  blocks: SolverBlock[];
  rows: SolverRowSpec[];
  /** Target per row, resolved per day index. */
  targets: Record<RowKey, number[]>;
  settings: SolverSettings;
  inputHash: string;
}

export type SolverPhase = 'loading' | 'building' | 'solving' | 'rolling';

/** Structured notes from the solver; translated in the UI. */
export type SolverWarning =
  | { code: 'timeLimit' }
  | { code: 'timeLimitRolling' }
  | { code: 'fullModelFailed'; status: string }
  | { code: 'tooLarge'; xVars: number; binaries: number };

export type WorkerRequest = { type: 'solve'; input: SolverInput };

export type WorkerResponse =
  | { type: 'progress'; phase: SolverPhase; day?: number; days?: number; detail?: string }
  | { type: 'result'; schedule: Schedule; warnings: SolverWarning[] }
  | { type: 'error'; message: string };
