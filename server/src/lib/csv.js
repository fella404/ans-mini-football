// CSV RFC 4180: kutip nilai yang mengandung pemisah/kutip/newline.
// Guard formula injection: sel berawalan = + - @ diprefix ' (Excel/Sheets bisa eksekusi formula).
const NEEDS_QUOTE = /[",\r\n]/;
const FORMULA = /^[=+\-@]/;

function escapeCell(value) {
  let s = value == null ? '' : String(value);
  if (FORMULA.test(s)) s = `'${s}`;
  return NEEDS_QUOTE.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// BOM di depan agar Excel membaca UTF-8 dengan benar.
export function toCsv(headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
