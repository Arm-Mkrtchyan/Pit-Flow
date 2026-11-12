import type { Block, BlockFieldKey } from '../../types/domain';

/** A parsed spreadsheet cell before typing. */
export type Cell = string | number | null;
export type Grid = Cell[][];

/** Field → column index in the file. */
export type FieldMapping = Partial<Record<BlockFieldKey, number>>;

export interface ParsedFile {
  fileName: string;
  headers: string[];
  /** Rows after the header; may include blank rows (skipped during mapping). */
  rows: Grid;
  /** 1-based line/row number of the header in the file. */
  headerRowNumber: number;
  meta: { kind: 'csv' | 'xlsx'; encoding?: string; delimiter?: string };
}

export type IssueLevel = 'error' | 'warning';

export interface ImportIssue {
  level: IssueLevel;
  /** 1-based row number in the source file. */
  row: number;
  message: string;
}

export interface MappedResult {
  blocks: Block[];
  issues: ImportIssue[];
  totalRows: number;
}
