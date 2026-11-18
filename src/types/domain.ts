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
  /** Raw Участок / site name from the file (e.g. location_cn1740_mf_17), if present. */
  site?: string;
  /** Normalised site key used to match actuals, e.g. "cn1740-17". */
  siteKey?: string;
  /** Planned mining period of this block (inclusive), from the block file. */
  miningStart?: IsoDate;
  miningEnd?: IsoDate;
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
  | 'density'
  | 'site'
  | 'miningStart'
  | 'miningEnd';

/** User-editable per-block state. */
export interface BlockUserInput {
  /** 0 ≤ remaining ≤ weight, tonnes. */
  remaining: number;
  /** Parent blocks (AND semantics). Single-select in UI for now. */
  dependsOn: BlockId[];
  /** Productivity limit: at most this many tonnes per day from the block. Missing = no limit. */
  dailyMax?: number;
  /** Grades of the remaining material, recalculated from actual extraction (mass balance). */
  grades?: Partial<Record<GradeField, number>>;
  /** Actual extraction applied to this block (from the actuals Excel). */
  actuals?: { before: IsoDate; tonnes: number; overrun: number };
}

export type GradeField = 'cu' | 'mo' | 'as' | 'pb' | 'eq';

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
  /** Extra penalty weight on early days (0 = none; 0.5 = day 1 counts 1.5× the last day). */
  earlyDayPreference: number;
  /**
   * Aim at the exact target (true) instead of treating the whole ±tolerance band as on target
   * (false). Colouring always uses the band.
   */
  aimExactTarget: boolean;
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
  /** 'accept' = accepted schedule; 'actuals' = actual extraction imported from Excel. */
  kind?: 'accept' | 'actuals';
  acceptedAt: string;
  range: [IsoDate, IsoDate];
  before: Record<BlockId, number>;
  taken: Record<BlockId, number>;
  /** Full user inputs before the change (actuals also change grades). */
  beforeInputs?: Record<BlockId, BlockUserInput>;
}

// ---------------------------------------------------------------------------------------------
// Drilling planning

/** One drilling block = one Участок (siteKey, e.g. "cn1740-17"), or a block ID without a site. */
export type DrillBlockKey = string;

/** Rig performance at one position (pit code, e.g. "cn"; "*" = any position). */
export interface DrillRigPosition {
  /** Blasted rock per drilled linear metre, m³/lm. */
  blastIndex: number;
  /** Drilling rate, linear metres per hour. */
  productivity: number;
}

/** Productivity of one rig model (from the productivity workbook). */
export interface DrillModel {
  id: string;
  name: string;
  /** Working hours per day; falls back to the drilling setting. */
  hoursPerDay?: number;
  byPosition: Record<string, DrillRigPosition>;
}

/** One working rig of the equipment list, e.g. "СБШ - 2", and the model it drills like. */
export interface DrillUnit {
  id: string;
  name: string;
  /** Productivity model; null when none matches (the rig then cannot be planned). */
  modelId: string | null;
}

/** A working rig joined with its model's productivity (derived, not persisted). */
export interface DrillRig {
  id: string;
  name: string;
  /** Model name; undefined when the rig has no productivity model. */
  model?: string;
  /** Working hours per day; falls back to the drilling setting. */
  hoursPerDay?: number;
  byPosition: Record<string, DrillRigPosition>;
}

/** One rig row of a drilling block (a block can have several rigs). */
export interface DrillAssignment {
  rowId: string;
  rigId: string | null;
  /** Day this rig starts drilling the block (at shift start). */
  start: IsoDate | null;
  /** Linear metres already drilled by this row, typed by the user. */
  drilledLm: number;
}

export interface DrillSettings {
  /** Minutes to charge one borehole after drilling ends. */
  loadMinutesPerHole: number;
  /** Minutes to assemble the explosive charge (blast network) after loading, before the blast. */
  installMinutes: number;
  /** Blast time of day, "HH:mm". */
  blastTime: string;
  /** Rigs start work at this time of day, "HH:mm". */
  shiftStart: string;
  /** Default working hours per day for rigs without their own value. */
  hoursPerDay: number;
}

/**
 * One blast location of the drilling page, from the production schedule file: all rows of one
 * Mining Location (every cell, material and period) summed up.
 */
export interface DrillSourceBlock {
  /** Matches the extraction site key where possible ("cn1740-24"); otherwise the lower-case name. */
  key: DrillBlockKey;
  /** Mining Location exactly as in the file, e.g. "location_cn1740_mf_24". */
  location: string;
  elevation: number;
  /** Σ Volume of the location's rows in the file, m³. */
  volume: number;
  /** Materials of the rows, in file order (MF, WD, DUMP …). */
  materials: string[];
  /** Days with scheduled mining, sorted ascending. */
  miningDays: IsoDate[];
}

export interface DrillingState {
  /** Block list of the drilling page; separate from the extraction block list. */
  blocks: DrillSourceBlock[];
  range: [IsoDate, IsoDate] | null;
  /** Productivity per rig model. */
  models: DrillModel[];
  /** Working rigs offered in the table. */
  rigs: DrillUnit[];
  assignments: Record<DrillBlockKey, DrillAssignment[]>;
  settings: DrillSettings;
}
