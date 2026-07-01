/** Escapes a CSV cell (quotes if it contains a comma, quote, or newline). */
const cell = (value: unknown): string => {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Builds CSV text from a header row and object rows, then triggers a download. */
export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void => {
  const content = [headers, ...rows].map((r) => r.map(cell).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
