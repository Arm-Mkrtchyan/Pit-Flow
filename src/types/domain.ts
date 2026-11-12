import type { I18nKey } from '../shared/i18n/t';

/** `${elevation}-${group}-${material}`, optionally suffixed `-r<row>` for duplicates. */
export type BlockId = string;
/** 'YYYY-MM-DD' */
export type IsoDate = string;

/** Immutable block data from the imported file. Units: t, m³, %, g/t, t/m³. */
export interface Block {
  id: BlockId;
  elevation: number;
  group: number;
  material: string;
  volume?: number;
  weight: number;
  cu: number;
  mo: number;
  as?: number;
  pb?: number;
  /** Cu-equivalent, %. Required: eq < settings.oreCutoffEq ⇒ waste. */
  eq: number;
  density?: number;
  /** 1-based row in the source file, for warnings. */
  sourceRow: number;
}

export type BlockFieldKey =
  | 'elevation'
  | 'group'
  | 'material'
  | 'volume'
  | 'weight'
  | 'cu'
  | 'mo'
  | 'as'
  | 'pb'
  | 'eq'
  | 'density';

/** User-editable per-block state. */
export interface BlockUserInput {
  /** 0 ≤ remaining ≤ weight, tonnes. */
  remaining: number;
  /** Parent blocks (AND semantics). Single-select in UI for now. */
  dependsOn: BlockId[];
}

/** Derived, never persisted. */
export type BlockClass = 'ore' | 'waste';

export type RowKind = 'target' | 'limit';
export type RowKey = 'tonnage' | 'cu' | 'mo' | 'wasteMax';
export type RowUnit = 't' | '%' | 'g/t';

export interface RowDescriptor {
  key: RowKey;
  labelKey: I18nKey;
  unit: RowUnit;
  /** target = two-sided soft band; limit = upper bound. */
  kind: RowKind;
  /** Grade rows are linearised against actual daily tonnage. */
  basis: 'tonnage' | 'grade';
  /** Which block pool the row sums over. */
  pool: BlockClass;
  /** Hard bound without slack (e.g. waste capacity). */
  hard?: boolean;
  blockField?: 'cu' | 'mo' | 'as' | 'pb' | 'eq';
  default: number;
  min: number;
  max: number;
  precision: number;
  step: number;
}

/** Per-day overrides only; a missing date falls back to the row default. */
export type DayTargets = Record<RowKey, Partial<Record<IsoDate, number>>>;

export interface RowSettings {
  /** Relative tolerance band, e.g. 0.10 = ±10 %. */
  tolerance: number;
  /** Penalty weight outside the band. */
  weightOut: number;
  /** Penalty weight for distance from the exact target. */
  weightIn: number;
}

export interface Settings {
  rows: Record<RowKey, RowSettings>;
  oreCutoffEq: number;
  wasteCostPerTonne: number;
  releaseThreshold: number;
  releaseEpsilon: number;
  roundingStep: 1 | 10 | 100;
  timeLimitSec: number;
  mipRelGap: number;
  rollingHorizonAbove: number;
  amberThreshold: number;
  lastColumnMapping?: Record<string, BlockFieldKey>;
}

export interface Allocation {
  blockId: BlockId;
  cls: BlockClass;
  tonnes: number;
  endBalance: number;
}

export interface ScheduleDay {
  date: IsoDate;
  /** tonnes > 0 only, parent-before-child order. */
  allocations: Allocation[];
}

export type ScheduleStatus = 'optimal' | 'time_limit' | 'rolling_horizon' | 'error';

export interface Schedule {
  days: ScheduleDay[];
  status: ScheduleStatus;
  mipGap?: number;
  solveMs: number;
  inputHash: string;
  solvedAt: string;
}

export interface AcceptedEntry {
  id: string;
  acceptedAt: string;
  range: [IsoDate, IsoDate];
  before: Record<BlockId, number>;
  taken: Record<BlockId, number>;
}
