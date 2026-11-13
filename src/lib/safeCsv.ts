/** Quote every cell and neutralize spreadsheet commands without changing stored data. */
export function safeCsvCell(value: unknown): string {
  const text = String(value ?? "");
  const unsafe = /^[\s\u0000-\u001f\u007f]*[=+\-@]/.test(text) || /^[\u0000-\u001f\u007f]/.test(text);
  return `"${(unsafe ? "'" + text : text).replace(/"/g, '""')}"`;
}

export function safeCsv(rows: readonly (readonly unknown[])[], separator = ","): string {
  return rows.map(row => row.map(safeCsvCell).join(separator)).join("\r\n");
}