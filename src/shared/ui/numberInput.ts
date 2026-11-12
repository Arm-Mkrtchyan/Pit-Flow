/** antd InputNumber formatter/parser pair with thousands separators (display only). */
export const formatThousands = (v: number | string | undefined): string => {
  if (v === undefined || v === '') return '';
  const [int = '', frac] = `${v}`.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac !== undefined ? `${grouped}.${frac}` : grouped;
};

export const parseThousands = (v: string | undefined): number =>
  Number((v ?? '').replace(/[,\s]/g, ''));
