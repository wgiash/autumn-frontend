export function csvCell(value: string | number | boolean): string {
  let text = String(value);
  // CSV quoting alone does not stop spreadsheet formula evaluation.
  if (typeof value === "string" && /^(?:[\t\r\n]|[\s\u0000-\u001f]*[=+@\-\uff1d\uff0b\uff0d\uff20])/u.test(text)) {
    text = "'" + text;
  }
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
