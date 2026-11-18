import { useState } from 'react';
import { Empty, Typography, theme } from 'antd';
import { t } from '../../shared/i18n/t';

/**
 * Placeholder of the empty block list: click it (it gets focus and is highlighted), then paste.
 * The paste itself is handled by the surrounding `PasteBlocksTarget`.
 */
export function PasteBlocksZone() {
  const { token } = theme.useToken();
  const [focused, setFocused] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('import.paste.label')}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
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
    </div>
  );
}
