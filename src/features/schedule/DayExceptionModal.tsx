import { useState } from 'react';
import { Alert, Descriptions, InputNumber, Modal, Radio, Space, Tag, Typography } from 'antd';
import { t, unit } from '../../shared/i18n/t';
import { fmtTonnes } from '../../shared/format';
import { formatThousands, parseThousands } from '../../shared/ui/numberInput';
import { useAppStore } from '../../store';
import type { BlockId, IsoDate } from '../../types/domain';
import { fromIso } from '../calendar';
import { effectiveDailyMax } from './solverInput';

export interface DayExceptionTarget {
  blockId: BlockId;
  date: IsoDate;
  /** Planned tonnes of the block that date in the current schedule. */
  planned: number;
}

type Mode = 'normal' | 'limit' | 'off';

/** Container: renders the exception modal for the clicked block/date cell, if any. */
export function DayExceptionModal({
  target,
  onClose,
}: {
  target: DayExceptionTarget | null;
  onClose: () => void;
}) {
  if (!target) return null;
  // key resets the draft whenever another cell is opened.
  return (
    <DayExceptionContent key={`${target.blockId}|${target.date}`} {...target} onClose={onClose} />
  );
}

function DayExceptionContent({
  blockId,
  date,
  planned,
  onClose,
}: DayExceptionTarget & { onClose: () => void }) {
  const input = useAppStore((s) => s.userInputs[blockId]);
  const minDaily = useAppStore((s) => s.settings.minDailyTonnes);
  const globalMax = useAppStore((s) => s.settings.maxDailyPerBlock);
  const dailyMax = effectiveDailyMax(input?.dailyMax, globalMax);
  const setDayOverride = useAppStore((s) => s.setDayOverride);
  const current = input?.dayOverrides?.[date];

  const [mode, setMode] = useState<Mode>(
    current?.off ? 'off' : current?.max !== undefined ? 'limit' : 'normal',
  );
  const [limit, setLimit] = useState<number | null>(current?.max ?? null);
  const limitValid = mode !== 'limit' || (limit !== null && limit > 0);

  const save = () => {
    if (!limitValid) return;
    setDayOverride(
      blockId,
      date,
      mode === 'off' ? { off: true } : mode === 'limit' && limit !== null ? { max: limit } : null,
    );
    onClose();
  };

  const others = Object.entries(input?.dayOverrides ?? {})
    .filter(([d]) => d !== date)
    .sort(([a], [b]) => a.localeCompare(b));
  const fmtDate = (d: IsoDate) => fromIso(d).format('DD.MM.YYYY');
  const describe = (o: { off?: boolean; max?: number }) =>
    o.off ? t('dayException.offShort') : `≤ ${fmtTonnes(o.max)} ${unit('t')}`;

  return (
    <Modal
      open
      width={520}
      title={t('dayException.title', { id: blockId, date: fmtDate(date) })}
      okText={t('blockModal.save')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: !limitValid }}
      onOk={save}
      onCancel={onClose}
    >
      <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('dayException.planned')}>
          {fmtTonnes(planned)} {unit('t')}
        </Descriptions.Item>
        <Descriptions.Item label={t('blockModal.dailyMax')}>
          {dailyMax !== undefined
            ? `${fmtTonnes(dailyMax)} ${unit('t/d')}`
            : t('blockModal.dailyMaxNone')}
        </Descriptions.Item>
      </Descriptions>

      <Radio.Group
        value={mode}
        onChange={(e) => setMode(e.target.value as Mode)}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <Radio value="normal">{t('dayException.normal')}</Radio>
        <Radio value="limit">
          <Space wrap>
            {t('dayException.limit')}
            <InputNumber<number>
              size="small"
              style={{ width: 170 }}
              min={1}
              step={500}
              value={limit}
              disabled={mode !== 'limit'}
              status={limitValid ? undefined : 'error'}
              formatter={formatThousands}
              parser={parseThousands}
              onChange={setLimit}
              onPressEnter={save}
              addonAfter={unit('t')}
              aria-label={t('dayException.limit')}
            />
          </Space>
        </Radio>
        <Radio value="off">{t('dayException.off')}</Radio>
      </Radio.Group>

      <Typography.Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
        {t('dayException.hint', { min: fmtTonnes(minDaily) })}
      </Typography.Paragraph>

      {others.length > 0 && (
        <Alert
          type="info"
          message={t('dayException.others')}
          description={
            <Space size={4} wrap>
              {others.map(([d, o]) => (
                <Tag
                  key={d}
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    setDayOverride(blockId, d, null);
                  }}
                >
                  {fmtDate(d)}: {describe(o)}
                </Tag>
              ))}
            </Space>
          }
        />
      )}
    </Modal>
  );
}
