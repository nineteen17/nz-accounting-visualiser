import type { Transaction } from "./types";

const c = (x = 0) => Math.round(x * 100);
const d = (x: number) => x / 100;

export interface GstPeriod {
  id: string;
  label: string;
  from: string;
  to: string;
  due: string;
}

/** Two-monthly GST periods for a 31 March balance date (category A) */
export const GST_PERIODS: GstPeriod[] = [
  { id: "P1", label: "April–May 2026", from: "2026-04-01", to: "2026-05-31", due: "2026-06-28" },
  { id: "P2", label: "June–July 2026", from: "2026-06-01", to: "2026-07-31", due: "2026-08-28" },
  { id: "P3", label: "August–September 2026", from: "2026-08-01", to: "2026-09-30", due: "2026-10-28" },
  { id: "P4", label: "October–November 2026", from: "2026-10-01", to: "2026-11-30", due: "2027-01-15" },
  { id: "P5", label: "December 2026–January 2027", from: "2026-12-01", to: "2027-01-31", due: "2027-02-28" },
  { id: "P6", label: "February–March 2027", from: "2027-02-01", to: "2027-03-31", due: "2027-05-07" },
];

/** The six two-monthly periods of the income year starting 1 April `y` (year 1 = 2026 gives GST_PERIODS) */
export function gstPeriodsFor(y: number, idPrefix = ""): GstPeriod[] {
  const n = y + 1;
  return [
    { id: `${idPrefix}P1`, label: `April–May ${y}`, from: `${y}-04-01`, to: `${y}-05-31`, due: `${y}-06-28` },
    { id: `${idPrefix}P2`, label: `June–July ${y}`, from: `${y}-06-01`, to: `${y}-07-31`, due: `${y}-08-28` },
    { id: `${idPrefix}P3`, label: `August–September ${y}`, from: `${y}-08-01`, to: `${y}-09-30`, due: `${y}-10-28` },
    { id: `${idPrefix}P4`, label: `October–November ${y}`, from: `${y}-10-01`, to: `${y}-11-30`, due: `${n}-01-15` },
    { id: `${idPrefix}P5`, label: `December ${y}–January ${n}`, from: `${y}-12-01`, to: `${n}-01-31`, due: `${n}-02-28` },
    { id: `${idPrefix}P6`, label: `February–March ${n}`, from: `${n}-02-01`, to: `${n}-03-31`, due: `${n}-05-07` },
  ];
}

export interface GstReturn {
  period: GstPeriod;
  box5: number; // total sales & income incl GST
  box6: number; // zero-rated supplies
  box7: number; // 5 - 6
  box8: number; // 7 × 3/23
  box9: number; // adjustments (debit adjustments)
  box10: number; // 8 + 9  total GST collected
  box11: number; // total purchases & expenses incl GST
  box12: number; // 11 × 3/23
  box13: number; // credit adjustments
  box14: number; // 12 + 13 total GST credit
  box15: number; // 10 - 14   (positive = pay, negative = refund)
  outputLines: { txn: Transaction; gst: number }[];
  inputLines: { txn: Transaction; gst: number }[];
  adjustments: { txn: Transaction; gst: number; type: "debit" | "credit" }[];
}

/** Build a GST101A-style return from the GST-tagged journal lines in a period */
export function gstReturn(txns: Transaction[], period: GstPeriod): GstReturn {
  let out = 0, inp = 0, adjOut = 0, adjIn = 0;
  const outputLines: GstReturn["outputLines"] = [];
  const inputLines: GstReturn["inputLines"] = [];
  const adjustments: GstReturn["adjustments"] = [];
  for (const t of txns) {
    if (t.date < period.from || t.date > period.to) continue;
    for (const l of t.lines) {
      if (l.account !== "210" || !l.gst) continue;
      const net = c(l.credit) - c(l.debit); // + = GST owed
      if (l.gst === "output") { out += net; outputLines.push({ txn: t, gst: d(net) }); }
      if (l.gst === "input") { inp -= net; inputLines.push({ txn: t, gst: d(-net) }); }
      if (l.gst === "adj-output") { adjOut += net; adjustments.push({ txn: t, gst: d(net), type: "debit" }); }
      if (l.gst === "adj-input") { adjIn -= net; adjustments.push({ txn: t, gst: d(-net), type: "credit" }); }
    }
  }
  const box8 = d(out);
  const box7 = Math.round((out * 23) / 3) / 100;
  const box11 = Math.round((inp * 23) / 3) / 100;
  const box12 = d(inp);
  const box9 = d(adjOut);
  const box13 = d(adjIn);
  const box10 = d(out + adjOut);
  const box14 = d(inp + adjIn);
  return {
    period,
    box5: box7,
    box6: 0,
    box7,
    box8,
    box9,
    box10,
    box11,
    box12,
    box13,
    box14,
    box15: d(out + adjOut - inp - adjIn),
    outputLines,
    inputLines,
    adjustments,
  };
}
