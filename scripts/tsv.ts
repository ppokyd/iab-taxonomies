/**
 * Shared TSV utilities used by the build script.
 */

export function parseTsvRows(raw: string): string[][] {
  return raw
    .split('\n')
    .map((line) => line.split('\t').map((cell) => cell.trim()));
}

export function nonEmpty(row: string[]): boolean {
  return row.some((cell) => cell.length > 0);
}
