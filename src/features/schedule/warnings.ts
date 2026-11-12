import { t } from '../../shared/i18n/t';
import { fmtNumber } from '../../shared/format';
import type { SolverWarning } from '../../types/solver';

export function warningText(w: SolverWarning): string {
  switch (w.code) {
    case 'timeLimit':
      return t('solve.warn.timeLimit');
    case 'timeLimitRolling':
      return t('solve.warn.timeLimitRolling');
    case 'fullModelFailed':
      return t('solve.warn.fullModelFailed', { status: w.status });
    case 'tooLarge':
      return t('solve.warn.tooLarge', {
        xVars: fmtNumber(w.xVars),
        binaries: fmtNumber(w.binaries),
      });
  }
}
