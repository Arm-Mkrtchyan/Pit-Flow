/**
 * Decode raw file bytes. Tries strict UTF-8 first (BOM stripped), then falls back
 * to Windows-1251, which Russian-locale Excel uses for CSV exports.
 */
export function decodeText(buffer: ArrayBuffer): {
  text: string;
  encoding: 'utf-8' | 'windows-1251';
} {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return { text: stripBom(text), encoding: 'utf-8' };
  } catch {
    const text = new TextDecoder('windows-1251').decode(buffer);
    return { text: stripBom(text), encoding: 'windows-1251' };
  }
}

export function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}
