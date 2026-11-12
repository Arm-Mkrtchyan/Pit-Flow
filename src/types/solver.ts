import type { Block, BlockClass, BlockId, IsoDate, RowKey, Settings } from './domain';

export interface SolverBlock extends Pick<Block, 'id' | 'cu' | 'mo' | 'as' | 'pb' | 'eq'> {
  cls: BlockClass;
  remaining: number;
  dependsOn: BlockId[];
}

/** Serialisable payload posted to the solver worker. */
export interface SolverInput {
  days: IsoDate[];
  blocks: SolverBlock[];
  /** Target per row, resolved per day index. */
  targets: Record<RowKey, number[]>;
  settings: Pick<
    Settings,
    | 'rows'
    | 'wasteCostPerTonne'
    | 'releaseThreshold'
    | 'releaseEpsilon'
    | 'roundingStep'
    | 'timeLimitSec'
    | 'mipRelGap'
    | 'rollingHorizonAbove'
  >;
}
