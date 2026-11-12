import { memo, useState } from 'react';
import { InputNumber, Tooltip } from 'antd';
import { t } from '../../shared/i18n/t';
import { formatThousands, parseThousands } from '../../shared/ui/numberInput';
import type { IsoDate, RowDescriptor } from '../../types/domain';
import styles from './ScheduleTable.module.css';

interface Props {
  desc: RowDescriptor;
  date: IsoDate;
  dateLabel: string;
  value: number;
  overridden: boolean;
  onCommit: (desc: RowDescriptor, date: IsoDate, value: number | null) => void;
}

/** Editable per-day target. Commits on blur/Enter so typing doesn't re-render the table. */
export const TargetCell = memo(function TargetCell({
  desc,
  date,
  dateLabel,
  value,
  overridden,
  onCommit,
}: Props) {
  const [draft, setDraft] = useState<number | null>(value);
  const [editing, setEditing] = useState(false);
  const thousands = desc.unit === 't';

  const commit = () => {
    setEditing(false);
    if (draft !== value) onCommit(desc, date, draft);
  };

  const input = (
    <InputNumber<number>
      size="small"
      variant="borderless"
      className={overridden ? `${styles.cell} ${styles.overridden}` : styles.cell}
      controls={false}
      min={desc.min}
      max={desc.max}
      step={desc.step}
      precision={desc.precision}
      value={editing ? draft : value}
      formatter={thousands ? formatThousands : undefined}
      parser={thousands ? parseThousands : undefined}
      onFocus={() => {
        setDraft(value);
        setEditing(true);
      }}
      onChange={setDraft}
      onBlur={commit}
      onPressEnter={commit}
      aria-label={t('schedule.cellLabel', { row: t(desc.labelKey), date: dateLabel })}
    />
  );

  return overridden ? (
    <Tooltip
      mouseEnterDelay={0.6}
      title={t('schedule.overridden', { value: formatThousands(desc.default) })}
    >
      {input}
    </Tooltip>
  ) : (
    input
  );
});
