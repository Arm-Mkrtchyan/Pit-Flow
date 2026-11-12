import { z } from 'zod';
import { t, type I18nKey } from '../../shared/i18n/t';

export { parseNumber, parseString } from '../../shared/utils/numbers';

const msg = (key: I18nKey, labelKey: I18nKey) => t(key, { field: t(labelKey) });

const num = (label: I18nKey) =>
  z
    .number({
      required_error: msg('import.err.missing', label),
      invalid_type_error: msg('import.err.notNumber', label),
    })
    .finite(msg('import.err.notNumber', label));
const nonNeg = (label: I18nKey) => num(label).min(0, msg('import.err.negative', label));
const positive = (label: I18nKey) => num(label).positive(msg('import.err.positive', label));
const grade = (label: I18nKey) => nonNeg(label).max(100, msg('import.err.gradeMax', label));

/**
 * Row schema. Built per import (not at module load) so validation messages use the language
 * active at the time of import.
 */
export const createBlockRowSchema = () =>
  z.object({
    elevation: num('field.elevation'),
    group: num('field.group'),
    material: z
      .string({ required_error: msg('import.err.missing', 'field.material') })
      .min(1, msg('import.err.missing', 'field.material')),
    volume: nonNeg('field.volume').optional(),
    weight: positive('field.weight'),
    cu: grade('field.cu'),
    mo: grade('field.mo'),
    as: nonNeg('field.as').optional(),
    pb: nonNeg('field.pb').optional(),
    eq: grade('field.eq'),
    density: positive('field.density').optional(),
    site: z.string().min(1).optional(),
  });

export type BlockRow = z.infer<ReturnType<typeof createBlockRowSchema>>;
