import type { I18nKey } from '../../shared/i18n/t';
import type { RowUnit } from '../../types/domain';

/** Informational tonnage-weighted rows shown under results (not optimised). */
export interface InfoRowDef {
  key: string;
  field: 'eq' | 'as' | 'pb';
  labelKey: I18nKey;
  unit: RowUnit;
}

export const INFO_ROWS: readonly InfoRowDef[] = [
  { key: 'info-eq', field: 'eq', labelKey: 'result.info.eq', unit: '%' },
  { key: 'info-as', field: 'as', labelKey: 'result.info.as', unit: 'g/t' },
  { key: 'info-pb', field: 'pb', labelKey: 'result.info.pb', unit: 'g/t' },
];
