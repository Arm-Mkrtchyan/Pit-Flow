import { theme } from 'antd';
import type { CellStatus } from './diagnostics';

/** Background colour per result status, from the antd theme. */
export function useStatusColors(): Record<CellStatus, string | undefined> {
  const { token } = theme.useToken();
  return {
    ok: token.colorSuccessBg,
    warn: token.colorWarningBg,
    bad: token.colorErrorBg,
    na: undefined,
  };
}
