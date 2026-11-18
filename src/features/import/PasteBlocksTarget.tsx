import { useState, type ClipboardEvent, type FocusEvent, type ReactNode } from 'react';
import { App, Typography, theme } from 'antd';
import { t } from '../../shared/i18n/t';
import { useAppStore } from '../../store';
import { ImportFlowModals } from './ImportFlowModals';
import { useImport } from './useImport';

/** Pasting into a text field (search, filters) must stay a normal paste. */
function isEditable(el: EventTarget | null): boolean {
  return (
    el instanceof HTMLElement &&
    (el.isContentEditable || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
  );
}

/**
 * Makes the block list a paste target: rows copied from Excel or a CSV file (header row first)
 * pasted anywhere in it, except into a text field, run the block import. With blocks already
 * loaded, the usual replace/merge choice follows. Clicking empty space in the list focuses it.
 */
export function PasteBlocksTarget({ children }: { children: ReactNode }) {
  const flow = useImport();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const hasBlocks = useAppStore((s) => s.blocks.length > 0);
  const [active, setActive] = useState(false);

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (isEditable(e.target)) return;
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (text.trim() === '') {
      void message.warning(t('import.paste.noText'));
      return;
    }
    void flow.handleText(text);
  };

  const onFocus = (e: FocusEvent<HTMLDivElement>) => setActive(!isEditable(e.target));
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setActive(false);
  };

  // The empty-list placeholder has its own highlight; this one is for a loaded list.
  const highlight = active && hasBlocks;

  return (
    <>
      <div
        tabIndex={-1}
        onPaste={onPaste}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          outline: 'none',
          borderRadius: token.borderRadiusLG,
          boxShadow: highlight ? `0 0 0 2px ${token.colorPrimaryBorder}` : 'none',
          transition: `box-shadow ${token.motionDurationMid}`,
        }}
      >
        {children}
        {highlight && (
          <Typography.Text type="secondary" style={{ fontSize: 12, paddingInline: 4 }}>
            {t('import.paste.more')}
          </Typography.Text>
        )}
      </div>
      <ImportFlowModals flow={flow} />
    </>
  );
}
