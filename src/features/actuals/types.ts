import type { BlockId, IsoDate } from '../../types/domain';

export type ActualGradeField = 'cu' | 'mo' | 'as' | 'pb';
export const ACTUAL_GRADE_FIELDS: readonly ActualGradeField[] = ['cu', 'mo', 'as', 'pb'];

/** One "actual" (Փաստ) row of the ore-extraction table. */
export interface ActualRow {
  /** 1-based Excel row number. */
  row: number;
  date: IsoDate;
  /** Block name as written, e.g. "CN1740-17". */
  name: string;
  /** Sum of the shift columns, tonnes. */
  tonnes: number;
  grades: Partial<Record<ActualGradeField, number>>;
}

export interface ParsedActuals {
  sheetName: string;
  rows: ActualRow[];
  /** Plan rows and rows without a block or tonnes are not used; counted for the summary. */
  skipped: { plan: number; noName: number; noTonnes: number };
  firstDate: IsoDate | null;
  lastDate: IsoDate | null;
  shiftCount: number;
}

/** Extracted totals per block name, up to (not including) the cut-off date. */
export interface ActualAggregate {
  /** Block name as first written in the file (e.g. "SS1875-27a"). */
  name: string;
  tonnes: number;
  /** Tonnage-weighted average grade: Σ(tᵢ·gᵢ) / Σtᵢ over rows that have the grade. */
  grades: Partial<Record<ActualGradeField, number>>;
  days: number;
  firstDate: IsoDate;
  lastDate: IsoDate;
}

export type ActualStatus = 'applied' | 'overrun' | 'unmatched' | 'noOre' | 'ambiguous';

/** What happened to one Excel block when applied to the block list. */
export interface ActualMatch {
  aggregate: ActualAggregate;
  status: ActualStatus;
  /** Ore blocks the tonnes were split across (proportionally to weight). */
  blocks: Array<{
    id: BlockId;
    share: number;
    remaining: number;
    gradesBefore: Partial<Record<'cu' | 'mo' | 'eq', number>>;
    gradesAfter: Partial<Record<'cu' | 'mo' | 'eq', number>>;
    clampedGrades: string[];
    /** Small remainder whose grade moved a lot — worth checking against the block model. */
    unstable: boolean;
  }>;
  /** Tonnes beyond the matched ore tonnage (0 when none). */
  overrun: number;
  /** Ambiguous matches: candidate names. */
  candidates?: string[];
}
