/** Round to cents */
export const r2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;

/** Sum a list of dollar amounts safely (in cents) */
export const sum = (xs: number[]) => xs.reduce((a, b) => a + Math.round(b * 100), 0) / 100;

const fmt = new Intl.NumberFormat("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 });

/** $1,234.56 — negatives shown in brackets like accountants do */
export function money(x: number, opts: { brackets?: boolean; dp?: 0 | 2; sign?: boolean } = {}) {
  const { brackets = true, dp = 2, sign = false } = opts;
  const v = Math.abs(r2(x));
  const s = "$" + (dp === 0 ? fmt0.format(v) : fmt.format(v));
  if (x < -0.004) return brackets ? `(${s})` : `−${s}`;
  if (sign && x > 0.004) return `+${s}`;
  return s;
}

/** Plain number with commas, 2dp, no $ */
export const num = (x: number) => (Math.abs(x) < 0.005 ? "–" : fmt.format(r2(x)));

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-04-08" → "8 Apr 2026" (no Date objects – avoids timezone surprises) */
export function nzDate(iso: string, withYear = true) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${months[m - 1]}${withYear ? " " + y : ""}`;
}
export const monthName = (iso: string) => months[Number(iso.split("-")[1]) - 1];
export const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp).replace(/\.0+$/, "")}%`;
