/**
 * "Build the journal entry" drills (E1 everyday transactions, E2 year-end adjustments).
 * Every question is a real transaction from Kōwhai's books (years 1 and 2): the learner reads
 * what happened and the source document, then picks the accounts, debit or credit, and amounts.
 */
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { balances } from "@/lib/engine/ledger";
import type { Transaction } from "@/lib/engine/types";
import { $, nzDate, pick, r2, shuffle, type Drill, type EntryLine, type EntryQ, type Rng } from "./core";

export const ACC = Object.fromEntries(ACCOUNTS.map((a) => [a.code, a]));

/** accounts beginners mix up with each other: offered as wrong choices next to the right ones */
export const MIX_UPS: Record<string, string[]> = {
  "100": ["105", "110", "115"], "105": ["100", "110"], "110": ["100", "120", "622"], "115": ["100", "450"],
  "120": ["125", "200", "400", "410"], "125": ["120", "225", "410"], "130": ["510", "511", "518", "519"],
  "135": ["136", "610", "205"], "136": ["135", "613", "205"], "140": ["450", "230", "141"], "141": ["230", "690", "140"],
  "150": ["135", "610", "160"], "160": ["616", "161", "625", "626"], "161": ["160", "626"], "165": ["616", "166", "626"],
  "166": ["165", "626"], "170": ["625", "171"], "171": ["170", "626"], "175": ["619", "625", "176"], "176": ["175", "626"],
  "200": ["205", "120", "100"], "205": ["200", "206", "135"], "206": ["205", "600", "215"], "210": ["215", "230", "100"],
  "215": ["600", "210", "206"], "216": ["215", "230", "310"], "220": ["602", "206", "600"], "225": ["125", "410", "120"],
  "230": ["690", "141", "210"], "240": ["605", "300", "310", "241"], "241": ["605", "300", "310", "240"], "250": ["630", "100", "300"],
  "300": ["310", "250", "240"], "310": ["300", "320", "690", "240"], "320": ["310", "300", "690"], "400": ["410", "120", "110"], "410": ["400", "120", "225"],
  "450": ["115", "140", "400"], "460": ["170", "175", "400"], "510": ["130", "511", "512"], "511": ["130", "510", "512"],
  "512": ["130", "510", "511"], "513": ["130", "510"], "518": ["130", "519"], "519": ["130", "518", "510"],
  "600": ["605", "206", "215", "602"], "601": ["600", "215"], "602": ["220", "600"], "605": ["240", "600"],
  "610": ["135", "150"], "611": ["205", "612"], "612": ["611", "619"], "613": ["136", "620"], "616": ["160", "165"],
  "617": ["623", "619"], "618": ["620", "616"], "619": ["175", "612"], "620": ["618", "613"], "621": ["622", "630"],
  "622": ["621", "110"], "623": ["617", "600"], "624": ["120", "410"], "625": ["170", "160"], "626": ["161", "166", "616"],
  "630": ["250", "621"], "690": ["230", "141"],
};

/** net each account in a transaction to one debit or credit line */
export function netLines(t: Transaction): EntryLine[] {
  const by = new Map<string, { net: number; why?: string }>();
  for (const l of t.lines) {
    const cur = by.get(l.account) ?? { net: 0 };
    cur.net = r2(cur.net + (l.debit ?? 0) - (l.credit ?? 0));
    cur.why ??= l.why;
    by.set(l.account, cur);
  }
  return [...by].filter(([, v]) => Math.abs(v.net) > 0.004).map(([account, v]) => ({ account, side: v.net > 0 ? "debit" : "credit", amount: Math.abs(v.net), why: v.why }));
}

/** one of each kind of transaction ("May 2026 power bill" and "June 2026 power bill" are the same exercise) */
export function uniqueKinds(txns: Transaction[], maxAccounts: number) {
  const seen = new Set<string>();
  return txns.filter((t) => {
    const lines = netLines(t);
    if (lines.length < 2 || lines.length > maxAccounts) return false;
    const sig = t.title.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/g, "M").replace(/\d[\d,.]*/g, "#").replace(/[\s–-]+/g, " ");
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

export const EVERYDAY_POOL = uniqueKinds([...Y1.DURING_YEAR, ...Y2.DURING_YEAR].filter((t) => t.kind === "featured" || t.kind === "routine"), 5);
export const ADJUSTMENT_POOL = uniqueKinds([...Y1.ADJUSTMENTS, ...Y2.ADJUSTMENTS], 6);

const yearOf = (iso: string) => (iso <= "2027-03-31" ? "year 1" : "year 2");

export function entryQuestion(rng: Rng, t: Transaction): EntryQ {
  const lines = netLines(t);
  const right = lines.map((l) => l.account);
  const near = shuffle(rng, [...new Set(right.flatMap((c) => MIX_UPS[c] ?? []))].filter((c) => !right.includes(c) && ACC[c]));
  const sameType = shuffle(rng, ACCOUNTS.filter((a) => !right.includes(a.code) && (a.code !== "320" || right.includes("310")) && right.some((c) => ACC[c].type === a.type)).map((a) => a.code));
  const extra = [...new Set([...near, ...sameType])].slice(0, Math.max(3, 8 - right.length));
  const options = [...right, ...extra].sort();
  const dr = lines.filter((l) => l.side === "debit"), cr = lines.filter((l) => l.side === "credit");
  const show = (ls: EntryLine[]) => ls.map((l) => `**${ACC[l.account].name}** ${$(l.amount)}`).join(", ");
  const explain =
    `**Debit** ${show(dr)}. **Credit** ${show(cr)}. Debits and credits both total ${$(r2(dr.reduce((s, l) => s + l.amount, 0)))}.` +
    (t.gstNote ? `\n\n${t.gstNote}` : "");
  const text = `${t.story} ${JSON.stringify(t.doc ?? {})} ${(t.notes ?? []).join(" ")}`;
  const written = (n: number) => [n.toFixed(2), n.toLocaleString("en-NZ", { minimumFractionDigits: 2 }), n.toLocaleString("en-NZ")].some((f) => text.includes(f));
  return {
    kind: "entry",
    amountsGiven: lines.every((l) => written(l.amount)),
    prompt: `**${t.title}** (${nzDate(t.date)}, ${yearOf(t.date)})`,
    date: t.date,
    story: t.story,
    doc: t.doc,
    options,
    lines,
    explain,
  };
}

/* ───────────── E3 closing entries, from the real year-end balances ───────────── */

const YEAR_ENDS = [
  { date: "2027-03-31", b: balances(Y1.BEFORE_CLOSING), profit: Y1.NET_PROFIT },
  { date: "2028-03-31", b: balances([Y2.OPENING_ENTRY, ...Y2.BEFORE_CLOSING]), profit: Y2.NET_PROFIT },
];
const closingTxn = (date: string, title: string, story: string, lines: Transaction["lines"]): Transaction => ({ id: `CLOSE-${title}`, date, title, kind: "closing", book: "general", story, lines });

export function closingQuestion(rng: Rng): EntryQ {
  const y = pick(rng, YEAR_ENDS);
  const kind = pick(rng, ["income", "expense", "expense", "summary"] as const);
  if (kind === "summary") {
    return entryQuestion(rng, closingTxn(y.date, "Close the income summary to retained earnings",
      `Every income and expense account has been closed. The [[income-summary|income summary]] now has a credit balance of ${$(y.profit)}: the year's profit after tax. Move it to [[retained-earnings|retained earnings]].`,
      [{ account: "320", debit: y.profit, why: "Empties the income summary: it's only used while closing." }, { account: "310", credit: y.profit, why: "The profit is kept in the business, so retained earnings (equity) goes up." }]));
  }
  const accts = ACCOUNTS.filter((a) => a.type === kind && a.code !== "519" && Math.abs(y.b[a.code] ?? 0) > 0.004);
  const a = pick(rng, accts);
  const bal = r2(Math.abs(y.b[a.code]));
  const income = kind === "income";
  return entryQuestion(rng, closingTxn(y.date, `Close ${a.name}`,
    `At ${nzDate(y.date)}, **${a.name}** has ${income ? "a credit" : "a debit"} balance of ${$(bal)}. Write the [[closing-entries|closing entry]] that resets it to zero.`,
    income
      ? [{ account: a.code, debit: bal, why: "Income has a credit balance, so a debit empties it." }, { account: "320", credit: bal, why: "The income moves into the income summary." }]
      : [{ account: "320", debit: bal, why: "The expense moves into the income summary." }, { account: a.code, credit: bal, why: "Expenses have debit balances, so a credit empties them." }]));
}

/* ───────────── E4 Part 4: what changes in year 2 ───────────── */

export const PART4_POOL = uniqueKinds(
  [...Y2.DURING_YEAR, ...Y2.ADJUSTMENTS].filter((t) => /Reverse|Sell the old|Depreciate the old|dividend|deposit becomes income|annual leave|provisional tax|instalment|card sales arrive|power bill finally/i.test(t.title)),
  6,
);

export const ENTRY_DRILLS: Drill[] = [
  {
    key: "entry", group: "record", title: "Build the journal entry", icon: "✍️", part: 2, length: 5,
    blurb: "A real Kōwhai transaction and its source document: choose the accounts, debit or credit, and the amounts.",
    learn: { href: "/cycle/journalise", label: "Step 3 · Journalise" },
    make: (rng) => entryQuestion(rng, pick(rng, EVERYDAY_POOL)),
  },
  {
    key: "adjustment-entry", group: "record", title: "Year-end adjustments", icon: "🗓️", part: 2, length: 5,
    blurb: "Accruals, prepayments, depreciation, stock, holiday pay, bad debts and tax: write each adjusting entry.",
    learn: { href: "/cycle/adjustments", label: "Step 7 · Adjusting entries" },
    make: (rng) => entryQuestion(rng, pick(rng, ADJUSTMENT_POOL)),
  },
  {
    key: "closing-entry", group: "record", title: "Closing entries", icon: "🔒", part: 2, length: 5,
    blurb: "Close Kōwhai's real income and expense accounts, then move the profit to retained earnings.",
    learn: { href: "/cycle/closing", label: "Step 10 · Closing" },
    make: closingQuestion,
  },
  {
    key: "year2-entry", group: "record", title: "Year 2 entries", icon: "🔁", part: 4, length: 5,
    blurb: "Reversing last year's accruals, selling an asset, paying a dividend, annual leave and provisional tax.",
    learn: { href: "/on-the-job?year=2", label: "A year on the job · Year 2" },
    make: (rng) => entryQuestion(rng, pick(rng, PART4_POOL)),
  },
];
