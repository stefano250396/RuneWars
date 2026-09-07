/**
 * Minimal RFC-4180-ish CSV parser.
 *
 * Handles: quoted fields, embedded commas / newlines / quotes ("" escape),
 * CRLF or LF line endings, a trailing newline, blank lines (skipped).
 *
 * parseCsv(text) -> { headers: string[], rows: Array<Record<string,string> & { _line: number }> }
 * `_line` is the 1-based line number in the source where the record begins
 * (line 1 = header), for error messages.
 */
export function parseCsv(text) {
  const src = String(text).replace(/^﻿/, ''); // strip BOM
  const records = [];
  let field = '';
  let record = [];
  let inQuotes = false;
  let line = 1;
  let recordStartLine = 1;
  let recordHasContent = false;

  const pushField = () => { record.push(field); field = ''; };
  const pushRecord = () => {
    pushField();
    // skip fully-empty records
    if (recordHasContent) records.push({ cells: record, line: recordStartLine });
    record = [];
    recordHasContent = false;
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; if (ch === '\n') line++; }
      continue;
    }

    if (ch === '"') { inQuotes = true; recordHasContent = true; continue; }
    if (ch === ',') { pushField(); recordHasContent = true; continue; }
    if (ch === '\r' && next === '\n') { pushRecord(); i++; line++; recordStartLine = line; continue; }
    if (ch === '\n' || ch === '\r') { pushRecord(); line++; recordStartLine = line; continue; }

    field += ch;
    if (ch.trim() !== '') recordHasContent = true;
  }
  // flush last record (file may not end with newline)
  if (field !== '' || record.length > 0) pushRecord();

  if (records.length === 0) return { headers: [], rows: [] };

  const headers = records[0].cells.map((h) => h.trim());
  const rows = records.slice(1).map((rec) => {
    const row = { _line: rec.line };
    headers.forEach((h, idx) => { row[h] = (rec.cells[idx] ?? '').trim(); });
    return row;
  });

  return { headers, rows };
}
