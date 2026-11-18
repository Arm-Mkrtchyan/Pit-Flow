import { useState, type ClipboardEvent } from 'react';
import { App, Empty, Spin, Typography, theme } from 'antd';
import { t } from '../../shared/i18n/t';
import { ImportFlowModals } from './ImportFlowModals';
import { useImport } from './useImport';

/**
 * Empty block list as a paste target: click it (it gets focus and is highlighted), then paste
 * rows copied from Excel or a CSV file, header row included. Runs the same flow as the upload.
 */
export function PasteBlocksZone() {
  const flow = useImport();
  const { step, handleText } = flow;
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [focused, setFocused] = useState(false);

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (text.trim() === '') {
      void message.warning(t('import.paste.noText'));
      return;
    }
    void handleText(text);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={t('import.paste.label')}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={onPaste}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: token.paddingLG,
          borderRadius: token.borderRadiusLG,
          border: `1px dashed ${focused ? token.colorPrimary : token.colorBorder}`,
          background: focused ? token.colorPrimaryBg : 'transparent',
          boxShadow: focused ? `0 0 0 2px ${token.colorPrimaryBorder}` : 'none',
          cursor: 'pointer',
          outline: 'none',
          transition: `all ${token.motionDurationMid}`,
        }}
      >
        <Spin spinning={step.kind === 'reading'}>
          <Empty
            description={
              <>
                <div>{t('blocks.empty')}</div>
                <Typography.Text type={focused ? undefined : 'secondary'} strong={focused}>
                  {focused ? t('import.paste.ready') : t('import.paste.hint')}
                </Typography.Text>
              </>
            }
          />
        </Spin>
      </div>
      <ImportFlowModals flow={flow} />
    </>
  );
}
