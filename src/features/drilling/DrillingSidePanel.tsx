import { Divider, Form, InputNumber, Space, Tag, theme, TimePicker, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { t, unit } from '../../shared/i18n/t';
import { clockToMinutes, minutesToClock } from '../../shared/utils/dates';
import { useAppStore } from '../../store';
import { CalendarPanel } from '../calendar';

const CLOCK = 'HH:mm';

const toDayjs = (clock: string): Dayjs | null => {
  const m = clockToMinutes(clock);
  return m === null ? null : dayjs().startOf('day').add(m, 'minute');
};
const fromDayjs = (d: Dayjs | null): string | null =>
  d ? minutesToClock(d.hour() * 60 + d.minute()) : null;

/** Right panel of the drilling page: period, blasting settings and a colour legend. */
export function DrillingSidePanel() {
  const range = useAppStore((s) => s.drilling.range);
  const setRange = useAppStore((s) => s.setDrillRange);
  const settings = useAppStore((s) => s.drilling.settings);
  const update = useAppStore((s) => s.setDrillSettings);
  const { token } = theme.useToken();

  const swatch = (background: string) => (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        borderRadius: 3,
        background,
        border: `1px solid ${token.colorBorderSecondary}`,
        verticalAlign: 'middle',
        marginInlineEnd: 6,
      }}
    />
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <CalendarPanel range={range} setRange={setRange} />
      <Divider style={{ margin: '8px 0' }} />
      <Typography.Title level={5} style={{ margin: 0 }}>
        {t('drilling.settings')}
      </Typography.Title>
      <Form layout="vertical" size="small">
        <Form.Item label={t('drilling.loadMinutes')} tooltip={t('drilling.loadMinutesHint')}>
          <InputNumber<number>
            min={0}
            max={600}
            style={{ width: '100%' }}
            suffix={unit('min')}
            value={settings.loadMinutesPerHole}
            onChange={(v) => v !== null && update({ loadMinutesPerHole: v })}
          />
        </Form.Item>
        <Form.Item label={t('drilling.installMinutes')} tooltip={t('drilling.installMinutesHint')}>
          <InputNumber<number>
            min={0}
            max={600}
            style={{ width: '100%' }}
            suffix={unit('min')}
            value={settings.installMinutes}
            onChange={(v) => v !== null && update({ installMinutes: v })}
          />
        </Form.Item>
        <Form.Item label={t('drilling.blastTime')} tooltip={t('drilling.blastTimeHint')}>
          <TimePicker
            format={CLOCK}
            allowClear={false}
            style={{ width: '100%' }}
            value={toDayjs(settings.blastTime)}
            onChange={(d) => {
              const v = fromDayjs(d);
              if (v) update({ blastTime: v });
            }}
          />
        </Form.Item>
        <Form.Item label={t('drilling.shiftStart')} tooltip={t('drilling.shiftStartHint')}>
          <TimePicker
            format={CLOCK}
            allowClear={false}
            style={{ width: '100%' }}
            value={toDayjs(settings.shiftStart)}
            onChange={(d) => {
              const v = fromDayjs(d);
              if (v) update({ shiftStart: v });
            }}
          />
        </Form.Item>
        <Form.Item label={t('drilling.hoursPerDay')} tooltip={t('drilling.hoursPerDayHint')}>
          <InputNumber<number>
            min={1}
            max={24}
            style={{ width: '100%' }}
            suffix={unit('h')}
            value={settings.hoursPerDay}
            onChange={(v) => v !== null && update({ hoursPerDay: v })}
          />
        </Form.Item>
      </Form>
      <Divider style={{ margin: '8px 0' }} />
      <Typography.Text strong>{t('drilling.legend')}</Typography.Text>
      <Typography.Text>
        {swatch(token.colorSuccessBgHover)}
        {t('drilling.legend.mining')}
      </Typography.Text>
      <Typography.Text>
        {swatch(token.colorPrimaryBgHover)}
        {t('drilling.legend.drilling')}
      </Typography.Text>
      <Typography.Text>
        {swatch(token.colorErrorBgHover)}
        {t('drilling.legend.conflict')}
      </Typography.Text>
      <Typography.Text>
        <Tag color="volcano">{t('drilling.blast')}</Tag>
        {t('drilling.legend.blast')}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {t('drilling.legend.click')}
      </Typography.Text>
    </Space>
  );
}
