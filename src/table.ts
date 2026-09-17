export type TableData = { headers: string[]; aligns: string[]; rows: string[][] };

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

export function parseTable(text: string): TableData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const headers = lines[0] ? splitRow(lines[0]) : [''];
  const aligns = lines[1] ? splitRow(lines[1]) : headers.map(() => '---');
  const rows = lines.slice(2).map(l => {
    const cells = splitRow(l);
    return headers.map((_, i) => cells[i] ?? '');
  });
  return { headers, aligns, rows };
}

export function serializeTable(t: TableData): string {
  const row = (cells: string[]) => `| ${cells.map(c => c || ' ').join(' | ')} |`;
  return [row(t.headers), row(t.aligns), ...t.rows.map(row)].join('\n');
}

export function addTableRow(t: TableData): TableData {
  return { ...t, rows: [...t.rows, t.headers.map(() => '')] };
}
export function removeTableRow(t: TableData, i: number): TableData {
  return { ...t, rows: t.rows.filter((_, ri) => ri !== i) };
}
export function addTableColumn(t: TableData): TableData {
  return { headers: [...t.headers, 'Column'], aligns: [...t.aligns, '---'], rows: t.rows.map(r => [...r, '']) };
}
export function removeTableColumn(t: TableData, i: number): TableData {
  return { headers: t.headers.filter((_, ci) => ci !== i), aligns: t.aligns.filter((_, ci) => ci !== i), rows: t.rows.map(r => r.filter((_, ci) => ci !== i)) };
}
export function setHeaderCell(t: TableData, ci: number, value: string): TableData {
  const headers = t.headers.slice(); headers[ci] = value; return { ...t, headers };
}
export function setBodyCell(t: TableData, ri: number, ci: number, value: string): TableData {
  const rows = t.rows.map(r => r.slice()); rows[ri][ci] = value; return { ...t, rows };
}
