import { useState } from 'react';
import { Button, InputNumber, Popover, Space } from 'antd';
import { t } from '../../shared/i18n/t';
import { formatThousands, parseThousands } from '../../shared/ui/numberInput';
import type { RowDescriptor } from '../../types/domain';

interface Props {
  desc: RowDescriptor;
  onApply: (value: number | null) => void;
}

export function ApplyAllPopover({ desc, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number | null>(desc.default);
  const thousands = desc.unit === 't';

  const apply = (v: number | null) => {
    onApply(v);
    setOpen(false);
  };

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      title={t('schedule.applyAllTitle', { row: t(desc.labelKey) })}
      content={
        <Space direction="vertical">
          <Space.Compact>
            <InputNumber<number>
              autoFocus
              min={desc.min}
              max={desc.max}
              step={desc.step}
              precision={desc.precision}
              value={value}
              formatter={thousands ? formatThousands : undefined}
              parser={thousands ? parseThousands : undefined}
              onChange={setValue}
              onPressEnter={() => apply(value)}
              addonAfter={desc.unit}
            />
            <Button type="primary" onClick={() => apply(value)}>
              {t('schedule.apply')}
            </Button>
          </Space.Compact>
          <Button size="small" type="link" onClick={() => apply(null)} style={{ padding: 0 }}>
            {t('schedule.resetDefault', {
              value: thousands ? formatThousands(desc.default) : desc.default,
            })}
          </Button>
        </Space>
      }
    >
      <Button size="small" type="link" style={{ padding: 0 }}>
        {t('schedule.applyAll')}
      </Button>
    </Popover>
  );
}
