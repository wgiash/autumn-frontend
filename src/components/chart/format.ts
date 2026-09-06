const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

export const ts = (iso: string) => Date.parse(iso + "T00:00:00Z");

export function weekLabel(iso: string) {
  const d = new Date(ts(iso));
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
