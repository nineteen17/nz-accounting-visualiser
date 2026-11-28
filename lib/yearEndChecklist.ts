/**
 * The year-end checklist's logic: items grouped by section or sorted by date, and the ticks saved on this device.
 * The items are data/books/yearEndChecklist.ts; the page is components/explore/YearEnd.tsx.
 */
import { SECTIONS, type CheckItem, type Checklist } from "@/data/books/yearEndChecklist";

export const bySection = (c: Checklist) =>
  SECTIONS.map((s) => ({ ...s, items: c.items.filter((i) => i.section === s.key) })).filter((s) => s.items.length);

/** in date order; items on the same date keep the checklist's order */
export const byDate = (c: Checklist): CheckItem[] =>
  c.items.map((i, n) => ({ i, n })).sort((a, b) => a.i.date.localeCompare(b.i.date) || a.n - b.n).map((x) => x.i);

/** "March 2027", for the timeline's month headings */
export const monthOf = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NZ", { month: "long", year: "numeric", timeZone: "UTC" });

/** the timeline grouped by month, in order */
export function byMonth(c: Checklist) {
  const out: { month: string; items: CheckItem[] }[] = [];
  for (const i of byDate(c)) {
    const m = monthOf(i.date);
    if (out.at(-1)?.month === m) out.at(-1)!.items.push(i);
    else out.push({ month: m, items: [i] });
  }
  return out;
}

/* ticks on this device: for each year, the ids ticked off */
export const TICKS_KEY = "year-end-checklist-v1";
export type Ticks = Record<string, string[]>;
type Store = Pick<Storage, "getItem" | "setItem">;

export function loadTicks(store: Store | undefined): Ticks {
  try {
    const t = JSON.parse(store?.getItem(TICKS_KEY) ?? "{}");
    return t && typeof t === "object" ? (t as Ticks) : {};
  } catch {
    return {};
  }
}

export function toggleTick(store: Store | undefined, year: string, id: string): Ticks {
  const all = loadTicks(store);
  const now = new Set(all[year] ?? []);
  if (now.has(id)) now.delete(id); else now.add(id);
  all[year] = [...now];
  store?.setItem(TICKS_KEY, JSON.stringify(all));
  return all;
}

export function clearTicks(store: Store | undefined, year: string): Ticks {
  const all = loadTicks(store);
  delete all[year];
  store?.setItem(TICKS_KEY, JSON.stringify(all));
  return all;
}

/** ticks that still match an item (an item removed later doesn't count) */
export const done = (c: Checklist, ticks: Ticks) => c.items.filter((i) => ticks[c.key]?.includes(i.id)).length;
