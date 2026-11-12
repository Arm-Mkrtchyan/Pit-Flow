/** Trigger a browser download of a Blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFileName(range: readonly [string, string] | undefined, ext: string): string {
  return range ? `pitflow-schedule_${range[0]}_${range[1]}.${ext}` : `pitflow-schedule.${ext}`;
}
