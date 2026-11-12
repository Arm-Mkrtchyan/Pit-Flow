import type { RowDescriptor, RowKey } from '../../types/domain';

/**
 * Data-driven schedule rows. To add a target/limit (e.g. max As), add a descriptor here
 * and extend the model builder — the table renders whatever is in this list.
 */
export const ROW_DESCRIPTORS: readonly RowDescriptor[] = [
  {
    key: 'tonnage',
    labelKey: 'row.tonnage',
    unit: 't',
    kind: 'target',
    basis: 'tonnage',
    pool: 'ore',
    default: 70000,
    min: 0,
    max: 1_000_000,
    precision: 0,
    step: 1000,
  },
  {
    key: 'cu',
    labelKey: 'row.cu',
    unit: '%',
    kind: 'target',
    basis: 'grade',
    pool: 'ore',
    blockField: 'cu',
    default: 0.259,
    min: 0,
    max: 100,
    precision: 3,
    step: 0.001,
  },
  {
    key: 'mo',
    labelKey: 'row.mo',
    unit: '%',
    kind: 'target',
    basis: 'grade',
    pool: 'ore',
    blockField: 'mo',
    default: 0.039,
    min: 0,
    max: 100,
    precision: 3,
    step: 0.001,
  },
  {
    key: 'wasteMax',
    labelKey: 'row.wasteMax',
    unit: 't',
    kind: 'limit',
    basis: 'tonnage',
    pool: 'waste',
    hard: true,
    default: 70000,
    min: 0,
    max: 1_000_000,
    precision: 0,
    step: 1000,
  },
];

export const ROW_BY_KEY: Readonly<Record<RowKey, RowDescriptor>> = Object.fromEntries(
  ROW_DESCRIPTORS.map((d) => [d.key, d]),
) as Record<RowKey, RowDescriptor>;
