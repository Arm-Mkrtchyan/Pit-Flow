import { Button, DatePicker, Space, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import { t } from '../../shared/i18n/t';
import { useAppStore } from '../../store';
import { enumerateDays, fromIso, MAX_HORIZON_DAYS, nextDaysRange, toIso } from './dateRange';

const PRESETS = [7, 14, 30] as const;
const DISPLAY = 'DD.MM.YYYY';

export function CalendarPanel() {
  const range = useAppStore((s) => s.plan.range);
  const setRange = useAppStore((s) => s.setRange);
  const days = enumerateDays(range).length;

  const value: [Dayjs, Dayjs] | null = range ? [fromIso(range[0]), fromIso(range[1])] : null;

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Title level={5} style={{ margin: 0 }}>
        {t('layout.calendar')}
      </Typography.Title>
      <DatePicker.RangePicker
        style={{ width: '100%' }}
        format={DISPLAY}
        value={value}
        aria-label={t('calendar.range')}
        disabledDate={(current, info) => {
          const from = info.from;
          return from ? Math.abs(current.diff(from, 'day')) >= MAX_HORIZON_DAYS : false;
        }}
        onChange={(v) => {
          const [a, b] = v ?? [];
          setRange(a && b ? [toIso(a), toIso(b)] : null);
        }}
      />
      <Typography.Text type="secondary">
        {range
          ? t('calendar.summary', {
              days,
              start: fromIso(range[0]).format(DISPLAY),
              end: fromIso(range[1]).format(DISPLAY),
            })
          : t('calendar.none')}
      </Typography.Text>
      <Typography.Text strong>{t('calendar.presets')}</Typography.Text>
      <Space wrap>
        {PRESETS.map((n) => (
          <Button key={n} size="small" onClick={() => setRange(nextDaysRange(n))}>
            {t('calendar.next', { days: n })}
          </Button>
        ))}
        {range && (
          <Button size="small" type="link" onClick={() => setRange(null)}>
            {t('calendar.clear')}
          </Button>
        )}
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {t('calendar.maxDays', { days: MAX_HORIZON_DAYS })}
      </Typography.Text>
    </Space>
  );
}
