import { memo } from 'react';
import { Tooltip } from 'antd';
import { t } from '../../shared/i18n/t';
import { fmtByUnit, fmtDeviation } from '../../shared/format';
import type { RowUnit } from '../../types/domain';
import type { RowResult } from './diagnostics';
import styles from './ScheduleTable.module.css';

interface Props {
  result: RowResult;
  unit: RowUnit;
}

/** Achieved value with deviation; colour comes from the cell background (set by the column). */
export const ResultCell = memo(function ResultCell({ result, unit }: Props) {
  const { value, deviation, band, status, reason, target } = result;
  const tip = [
    `${t('result.target')}: ${fmtByUnit(target, unit)}`,
    band ? `${t('result.band')}: ${fmtByUnit(band[0], unit)} – ${fmtByUnit(band[1], unit)}` : null,
    reason ?? null,
  ]
    .filter(Boolean)
    .join('\n');
  return (
    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{tip}</span>} mouseEnterDelay={0.3}>
      <div
        className={styles.result}
        aria-label={`${fmtByUnit(value, unit)} ${t(`status.${status}`)}`}
      >
        <span>{fmtByUnit(value, unit)}</span>
        {deviation !== null && <small>{fmtDeviation(deviation)}</small>}
        {status === 'bad' && <small className={styles.flag}>{t('status.bad')}</small>}
      </div>
    </Tooltip>
  );
});
