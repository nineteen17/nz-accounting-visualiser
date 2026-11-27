/**
 * "Sort it" drills (Phase 2, C1–C12): quick classification questions.
 * Where the café's books can supply the example (cash flows, the equation, TB errors, documents,
 * GST treatment, temporary accounts, US terms) the question is generated from them. The rest are
 * short scenarios built on the same NZ rules the course teaches (lib/nz/rates.ts).
 */
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { DOC_KIND_LABEL } from "@/data/docKinds";
import { GLOSSARY, GLOSSARY_MAP } from "@/data/glossary";
import { CF_LABELS } from "@/lib/engine/statements";
import { DEPRECIATION } from "@/lib/nz/rates";
import type { Transaction } from "@/lib/engine/types";
import { $, $$, int, mc, nzDate, pick, r2, shuffle, type ChoiceQ, type Drill, type Rng } from "./core";
import { ACC, MIX_UPS, netLines, uniqueKinds } from "./entries";

const ALL_TXNS = [...Y1.DURING_YEAR, ...Y1.ADJUSTMENTS, ...Y2.DURING_YEAR, ...Y2.ADJUSTMENTS];
const when = (t: Transaction) => `**${t.title}** (${nzDate(t.date)})`;
/** pick one scenario from a list and ask it as multiple choice */
function scenario<S extends { q: string; a: string; why: string }>(rng: Rng, list: S[], options: string[], lead = ""): ChoiceQ {
  const s = pick(rng, list);
  const wrong = options.filter((o) => o !== s.a);
  return mc(rng, s.a, options.length > 4 ? shuffle(rng, wrong).slice(0, 3) : wrong, lead + s.q, s.why);
}

/* ───────────── C1 operating, investing or financing ───────────── */

const SECTION_NAME = { operating: "Operating", investing: "Investing", financing: "Financing" } as const;
const SECTION_WHY = {
  operating: "day-to-day trading: customers, suppliers, staff, interest and tax",
  investing: "buying or selling long-term assets and investments",
  financing: "money from or back to the owners and lenders",
};
export const CASH_POOL = uniqueKinds(ALL_TXNS.filter((t) => t.lines.some((l) => ACC[l.account].cf === "cash")), 6)
  .map((t) => {
    const others = netLines(t).filter((l) => ACC[l.account].cf !== "cash");
    const main = others.filter((l) => ACC[l.account].cf !== "gst").sort((a, b) => b.amount - a.amount)[0] ?? others[0];
    const tag = main ? ACC[main.account].cf : "none";
    const cash = netLines(t).filter((l) => ACC[l.account].cf === "cash").reduce((s, l) => s + (l.side === "debit" ? l.amount : -l.amount), 0);
    return { t, tag, cash: r2(cash) };
  })
  .filter((x) => x.tag in CF_LABELS && Math.abs(x.cash) > 0.004);

function cashFlow(rng: Rng): ChoiceQ {
  const { t, tag, cash } = pick(rng, CASH_POOL);
  const sec = CF_LABELS[tag].section;
  return mc(rng, SECTION_NAME[sec], Object.values(SECTION_NAME),
    `${when(t)}: ${$(Math.abs(cash))} ${cash > 0 ? "comes into" : "goes out of"} the bank. In the [[cash-flow-statement|cash flow statement]], which activity is it?`,
    `**${SECTION_NAME[sec]}**: ${SECTION_WHY[sec]}. It's shown under "${CF_LABELS[tag].label}".` +
      (tag === "interest-paid" || tag === "interest-received" ? " (NZ IFRS lets interest go in operating or financing/investing; Kōwhai, like most small companies, keeps it in operating.)" : "") +
      (tag === "borrowings" ? " Loan repayments are financing, but the interest part is operating." : ""));
}

/* ───────────── C2 capital or revenue ───────────── */

const LVA = DEPRECIATION.lowValueAssetThreshold;
const CAPITAL = "Capital: record it as an asset and depreciate it";
const REVENUE = "Revenue: an expense this year";
const LOW = `Low-value asset: write it off now (under ${$$(LVA)})`;
const CAPEX = [
  { q: "Kōwhai buys a commercial espresso machine and grinder for $16,000.", a: CAPITAL, why: "It will help earn income for years, so it's an asset (plant & equipment), depreciated over its life." },
  { q: "The shopfitter builds counters, shelving and lighting for $30,000.", a: CAPITAL, why: "The fit-out lasts for years, so it's capitalised as an asset and depreciated." },
  { q: "Kōwhai buys a blender for $450.", a: LOW, why: `It lasts more than a year, but it costs less than ${$$(LVA)}, so the low-value asset rule lets Kōwhai write it off straight away.` },
  { q: "A technician repairs the grinder's motor for $380.", a: REVENUE, why: "A repair keeps an asset working as it was, so it's an expense (repairs & maintenance). It doesn't improve the asset." },
  { q: "Kōwhai buys a new POS system and tablets for $2,800.", a: CAPITAL, why: `It lasts for years and costs over ${$$(LVA)}, so it's an asset (computer equipment), depreciated.` },
  { q: "A month's coffee beans cost $3,200.", a: REVENUE, why: "Stock bought to sell is part of cost of goods sold, not a long-term asset." },
  { q: "Kōwhai buys 6 tables and 24 chairs for $8,000 in one purchase.", a: CAPITAL, why: "Bought together as one set for over the threshold, so they're capitalised as furniture & fittings." },
  { q: "The café's walls are repainted for $1,800 to freshen them up.", a: REVENUE, why: "Repainting restores the premises to how they were; it's maintenance, so an expense, even though it's over $1,000." },
  { q: "Kōwhai builds an extra outdoor seating deck for $14,000.", a: CAPITAL, why: "It adds something new that lasts for years, so it's an improvement: capitalised and depreciated." },
  { q: "A year's accounting software subscription costs $480.", a: REVENUE, why: "It's a service used up during the year, not an asset Kōwhai owns." },
  { q: "Kōwhai buys a $650 commercial toaster.", a: LOW, why: `Under ${$$(LVA)}, so it can be written off when it's bought instead of depreciated.` },
  { q: "Kōwhai buys a $1,600 laptop for the office.", a: CAPITAL, why: `It costs more than ${$$(LVA)} and lasts years, so it's capitalised and depreciated.` },
];
const capital = (rng: Rng) => scenario(rng, CAPEX, [CAPITAL, REVENUE, LOW], "Capital or revenue? ");

/* ───────────── C3 effect on the accounting equation ───────────── */

export const EQ_POOL = uniqueKinds(ALL_TXNS, 6).map((t) => {
  let A = 0, L = 0, E = 0;
  for (const l of netLines(t)) {
    const dr = l.side === "debit" ? l.amount : -l.amount;
    const type = ACC[l.account].type;
    if (type === "asset") A += dr; else if (type === "liability") L -= dr; else E -= dr; // income/expense change equity
  }
  return { t, A: r2(A), L: r2(L), E: r2(E) };
});
const arrow = (n: number) => (Math.abs(n) < 0.005 ? "no change" : n > 0 ? "↑" : "↓");
const eqLabel = (A: number, L: number, E: number) => `Assets ${arrow(A)} · Liabilities ${arrow(L)} · Equity ${arrow(E)}`;

const ELEMENT = { asset: "asset", liability: "liability", equity: "equity", income: "income", expense: "expense" } as const;

function equationEffect(rng: Rng): ChoiceQ {
  const { t, A, L, E } = pick(rng, EQ_POOL);
  const right = eqLabel(A, L, E);
  const dirs = [1, -1, 0];
  const wrong = shuffle(rng, dirs.flatMap((a) => dirs.flatMap((l) => dirs.map((e) => eqLabel(a, l, e))))).filter((x) => x !== right).slice(0, 3);
  // each account's movement, in words
  const moves = netLines(t).map((l) => {
    const a = ACC[l.account];
    const up = (l.side === "debit") === (a.normal === "debit");
    const effect = a.type === "income" ? `, so equity ${up ? "↑" : "↓"}` : a.type === "expense" ? `, so equity ${up ? "↓" : "↑"}` : "";
    return `${a.name} (${ELEMENT[a.type]}${a.contra ? ", contra" : ""}) ${up ? "↑" : "↓"} ${$(l.amount)}${effect}`;
  });
  const net = (name: string, n: number) => (Math.abs(n) < 0.005 ? `${name} no change` : `${name} ${n > 0 ? "↑" : "↓"} ${$(Math.abs(n))}`);
  const swap = Math.abs(A) < 0.005 && Math.abs(L) < 0.005 && Math.abs(E) < 0.005;
  return mc(rng, right, wrong, `${when(t)}. What happens to the [[accounting-equation|accounting equation]] overall?`,
    `${moves.join("; ")}.

` +
      (swap
        ? "One item goes up and another of the same kind goes down by the same amount, so the totals don't change: **no change** to assets, liabilities or equity."
        : `Overall: **${net("assets", A)}**, **${net("liabilities", L)}**, **${net("equity", E)}**. Income raises equity and expenses lower it. Both sides change by the same amount, so it still balances.`));
}

/* ───────────── C4 trial balance errors (CROPOC) ───────────── */

const CROPOC = {
  C: "Commission",
  R: "Complete reversal",
  O: "Omission",
  P: "Principle",
  OE: "Original entry",
  CO: "Compensating",
  X: "Not CROPOC: the trial balance won't balance",
};
const PLURAL = { asset: "assets", liability: "liabilities", equity: "equity", income: "income", expense: "expenses" } as const;
const SIMPLE = uniqueKinds(ALL_TXNS, 2).filter((t) => netLines(t).length === 2 && netLines(t)[0].amount >= 50);

function swapDigits(n: number) {
  const s = String(Math.round(n));
  for (let i = 0; i < s.length - 1; i++) if (s[i] !== s[i + 1]) return Number(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2));
  return Math.round(n) + 90;
}

function tbError(rng: Rng): ChoiceQ {
  const t = pick(rng, SIMPLE);
  const lines = netLines(t);
  const dr = lines.find((l) => l.side === "debit")!, cr = lines.find((l) => l.side === "credit")!;
  const amt = dr.amount, D = ACC[dr.account], C = ACC[cr.account];
  const sameType = (code: string) => (MIX_UPS[code] ?? []).map((c) => ACC[c]).filter((a) => a && a.type === ACC[code].type);
  const otherType = (code: string) => (MIX_UPS[code] ?? []).map((c) => ACC[c]).filter((a) => a && a.type !== ACC[code].type);
  const kinds: { k: keyof typeof CROPOC; text: string; why: string }[] = [
    { k: "O", text: `The whole entry is left out of the books.`, why: "Nothing was posted, so both sides are missing equally." },
    { k: "R", text: `It's posted as debit ${C.name} and credit ${D.name}: the sides are swapped.`, why: "A debit and a credit of the same amount were still posted, just to the wrong sides." },
    { k: "OE", text: `It's entered as ${$$(swapDigits(amt))} instead of ${$(amt)} on both sides.`, why: "The wrong amount went in, but the same wrong amount on both sides. Often it's from misreading the source document." },
    { k: "CO", text: `The ${D.name} account is added up ${$$(100)} too high, and a credit account is also added up ${$$(100)} too high.`, why: "Two separate errors cancel each other out." },
    { k: "X", text: `The debit is posted correctly, but the credit to ${C.name} is never posted.`, why: "Only one side went in, so total debits are bigger than total credits: the trial balance shows the error." },
    { k: "X", text: `The debit is posted as ${$(amt)} but the credit as ${$$(swapDigits(amt))}.`, why: `The two sides differ by ${$$(Math.abs(amt - swapDigits(amt)))}, so the trial balance doesn't balance. (A difference that divides by 9 often means two digits were swapped.)` },
  ];
  const s = sameType(dr.account)[0];
  if (s) kinds.push({ k: "C", text: `The debit goes to ${s.name} instead of ${D.name}.`, why: `Right amount, right type of account (both are ${PLURAL[D.type]}), wrong account. Both sides were still posted.` });
  const o = otherType(dr.account)[0];
  if (o) kinds.push({ k: "P", text: `The debit goes to ${o.name} instead of ${D.name}.`, why: `Posted to the wrong **type** of account (${o.type} instead of ${D.type}): it breaks an accounting principle, but debits still equal credits.` });
  const e = pick(rng, kinds);
  const balances = e.k !== "X";
  if (rng() < 0.4) {
    return mc(rng, balances ? "Yes, it still balances" : "No, it won't balance", ["Yes, it still balances", "No, it won't balance"],
      `${when(t)}: debit ${D.name}, credit ${C.name}, ${$(amt)}.\n\n${e.text}\n\nWill the [[trial-balance|trial balance]] still balance?`,
      `${balances ? `**Yes.** It's an error of ${CROPOC[e.k].toLowerCase()}. ` : "**No.** "}${e.why}`);
  }
  const wrong = shuffle(rng, Object.values(CROPOC).filter((x) => x !== CROPOC[e.k])).slice(0, 3);
  return mc(rng, CROPOC[e.k], wrong, `${when(t)}: debit ${D.name}, credit ${C.name}, ${$(amt)}.\n\n${e.text}\n\nWhat kind of error is it?`,
    `**${CROPOC[e.k]}.** ${e.why}` + (balances ? " It's one of the six errors a trial balance can't catch (CROPOC)." : ""));
}

/* ───────────── C5 bank reconciliation items ───────────── */

const TIMING = "Timing: no entry, it's shown in the reconciliation";
const CASHBOOK = "Enter it in the cashbook";
const BANK = "The bank's mistake: ask the bank to fix it";
function bankRec(rng: Rng): ChoiceQ {
  const n = (lo: number, hi: number) => $(r2(int(rng, lo * 100, hi * 100) / 100));
  const items = [
    { q: `Ben banked the takings of ${n(800, 2500)} in the night safe on 31 March. The bank statement shows it on 1 April.`, a: TIMING, why: "A **deposit in transit**: the cashbook is right; the bank just hasn't processed it yet. It's added to the bank statement balance in the reconciliation, and clears by itself." },
    { q: `Kōwhai paid a supplier ${n(300, 4000)} by online banking on 31 March; the bank processed it on 1 April.`, a: TIMING, why: "An **unpresented payment**: already in the cashbook, not yet on the statement. It's taken off the bank statement balance in the reconciliation." },
    { q: `The bank statement shows a monthly account fee of ${n(10, 30)} that isn't in the cashbook.`, a: CASHBOOK, why: "Kōwhai only learns about it from the statement, so the cashbook is updated: debit bank fees, credit bank." },
    { q: `The bank credited ${n(20, 200)} of interest on the term deposit, which isn't in the cashbook yet.`, a: CASHBOOK, why: "Real money Kōwhai has received: record it in the cashbook (debit bank, credit interest income, and RWT if it was deducted)." },
    { q: `The insurance direct debit of ${n(150, 400)} went out, but nobody entered it in the cashbook.`, a: CASHBOOK, why: "The payment really happened, so the cashbook is updated to include it." },
    { q: "The card settlement came in less merchant fees, and only the full sales amount was recorded.", a: CASHBOOK, why: "The fees were taken by the bank: record them (debit merchant fees) so the cashbook matches what arrived." },
    { q: "A supplier payment of $540 was entered in the cashbook as $450.", a: CASHBOOK, why: "An error in Kōwhai's own records: correct the cashbook by the $90 difference." },
    { q: "The statement shows a $25 fee that belongs to a different customer of the bank.", a: BANK, why: "Kōwhai's records are right; the bank made the mistake, so the bank is asked to reverse it. It's shown in the reconciliation until it's fixed." },
  ];
  return scenario(rng, items, [TIMING, CASHBOOK, BANK], "Bank reconciliation: ");
}

/* ───────────── C6 temporary or permanent ───────────── */

const TP_ACCOUNTS = ACCOUNTS.filter((a) => a.code !== "519");
function temporary(rng: Rng): ChoiceQ {
  const a = pick(rng, TP_ACCOUNTS);
  const right = a.temporary ? "Temporary: closed to zero at year end" : "Permanent: the balance carries on";
  return mc(rng, right, ["Temporary: closed to zero at year end", "Permanent: the balance carries on"],
    `At year end, is **${a.name}** a temporary or a permanent account?`,
    a.temporary
      ? `It's ${a.code === "320" ? "the income summary, used only while closing" : `${a.type === "income" ? "an income" : "an expense"} account`}, so it measures just this year: [[closing-entries]] reset it to zero and move the profit to retained earnings.`
      : `It's ${a.type === "asset" ? "an asset" : a.type === "liability" ? "a liability" : "equity"}: a balance sheet account, so its balance carries into next year. See [[temporary-accounts]].`);
}

/* ───────────── C7 GST treatment ───────────── */

const STD = "Standard-rated (15%)", ZERO = "Zero-rated (0%)", EXEMPT = "Exempt (no GST)", NONE = "Not a supply: GST doesn't apply";
const GST_LABEL = { standard: STD, zero: ZERO, exempt: EXEMPT, none: NONE } as const;
const GST_EXTRA = [
  { q: "A roaster sells coffee beans to a café in Australia, shipping them overseas.", a: ZERO, why: "Exported goods are **zero-rated**: GST at 0%, and the seller can still claim GST on its costs." },
  { q: "A café business is sold as a going concern to a GST-registered buyer.", a: ZERO, why: "The sale of a going concern between registered persons is **zero-rated**, so no GST changes hands." },
  { q: "A landlord rents out a flat for someone to live in.", a: EXEMPT, why: "Residential rent is an **exempt** supply: no GST is charged, and no GST can be claimed on related costs." },
  { q: "A bank charges interest on a loan.", a: EXEMPT, why: "Financial services such as interest are **exempt**: there's no GST on them." },
  { q: "Aroha takes $3,500 out of the company as drawings.", a: NONE, why: "Money moving between the company and its owner isn't a sale of goods or services, so GST doesn't apply." },
  { q: "Kōwhai pays Mia her wages.", a: NONE, why: "An employee isn't supplying services as a business, so wages have no GST." },
  { q: "Kōwhai sells a flat white over the counter.", a: STD, why: "Most sales in NZ are **standard-rated** at 15%, including food and drink." },
];
const GST_ACCOUNTS = ACCOUNTS.filter((a) => (a.type === "income" || a.type === "expense") && (a.gst !== "none" || ["600", "605"].includes(a.code)));
function gstType(rng: Rng): ChoiceQ {
  const opts = [STD, ZERO, EXEMPT, NONE];
  if (rng() < 0.5) return scenario(rng, GST_EXTRA, opts, "GST: ");
  const a = pick(rng, GST_ACCOUNTS);
  const right = GST_LABEL[a.gst];
  const why: Record<string, string> = {
    standard: "It's a taxable supply at 15%, so GST is charged (on sales) or claimed back (on purchases with a tax invoice).",
    exempt: "It's a financial service (fees, interest), which is exempt: there's no GST to charge or claim.",
    none: "It isn't a supply by a business (wages and shareholder salaries are paid to people as employees), so there's no GST.",
    zero: "It's zero-rated: GST at 0%.",
  };
  return mc(rng, right, opts.filter((o) => o !== right), `Kōwhai's **${a.name}**: what's the GST treatment?`, `**${right}.** ${why[a.gst]}`);
}

/* ───────────── C8 deductible for tax ───────────── */

const FULL = "Fully deductible", HALF = "50% deductible", NOT = "Not deductible", LATER = "Deductible later, or over time";
const DEDUCT = [
  { q: "Taking a potential catering client to lunch at a restaurant.", a: HALF, why: "Food and drink entertainment with a social element is only **50% deductible**; half is added back." },
  { q: "The staff Christmas party at a restaurant.", a: HALF, why: "Staff parties are entertainment, so only **50%** is deductible." },
  { q: "Morning tea for staff in the café's back room on a normal workday.", a: FULL, why: "Light refreshments at work, like a normal morning tea, aren't treated as entertainment, so they're **fully deductible**." },
  { q: "The café's rent.", a: FULL, why: "An ordinary cost of earning income: **fully deductible**." },
  { q: "Aroha's $60,000 shareholder salary for working in the café.", a: FULL, why: "A salary for work done is a deductible expense of the company (and taxable income on Aroha's own IR3)." },
  { q: "A parking fine for the delivery van.", a: NOT, why: "Fines and penalties are **not deductible**." },
  { q: "The company's own income tax.", a: NOT, why: "Income tax is worked out on taxable income, so it can't be deducted from it." },
  { q: "A $20,000 dividend paid to the shareholders.", a: NOT, why: "A dividend is a share of profit after tax, not a cost of earning it: **not deductible**." },
  { q: "The principal part of a loan repayment.", a: NOT, why: "Repaying the amount borrowed isn't an expense (the loan was never income). Only the **interest** is deductible." },
  { q: "The interest on the café's bank loan.", a: FULL, why: "Interest on money borrowed for the business is **fully deductible**." },
  { q: "A $16,000 espresso machine.", a: LATER, why: "It's a capital asset: the cost is deducted **over time** as depreciation (plus Investment Boost), not all at once." },
  { q: "Holiday pay accrued at 31 March that won't be paid within 63 days.", a: LATER, why: "Accrued holiday pay is only deductible if paid within 63 days of balance date; otherwise it's deducted **later**, when it's paid." },
  { q: "Groceries for Aroha's own home, paid by the company.", a: NOT, why: "Private spending isn't a business cost. It's treated as drawings, not an expense." },
  { q: "Writing off Pop-Up Events' unpaid $800 invoice.", a: FULL, why: "A bad debt that's actually written off is deductible (and its GST can be claimed back)." },
];
const deductible = (rng: Rng) => scenario(rng, DEDUCT, [FULL, HALF, NOT, LATER], "For income tax: ");

/* ───────────── C9 which source document ───────────── */

const DOC_POOL = uniqueKinds(ALL_TXNS.filter((t) => t.doc && t.doc.kind !== "internal"), 6);
function sourceDoc(rng: Rng): ChoiceQ {
  const t = pick(rng, DOC_POOL);
  const right = DOC_KIND_LABEL[t.doc!.kind];
  const wrong = shuffle(rng, Object.values(DOC_KIND_LABEL).filter((x) => x !== right && x !== DOC_KIND_LABEL.internal)).slice(0, 3);
  return mc(rng, right, wrong, `${when(t)}. Which [[source-document|source document]] is the evidence for this entry?`,
    `**${right}**: "${t.doc!.title}" from ${t.doc!.issuer}. Every entry needs a document like this behind it, kept for 7 years.`);
}

/* ───────────── C10 US → NZ terms ───────────── */

const US = GLOSSARY.filter((e) => e.category === "us" && e.nz && !["us-checking-account", "us-notes-payable"].includes(e.key) && GLOSSARY_MAP[e.nz].category !== "us");
function usToNz(rng: Rng): ChoiceQ {
  const e = pick(rng, US.filter((x) => x.nz !== x.key));
  const right = GLOSSARY_MAP[e.nz!].term;
  const wrong = shuffle(rng, [...new Set(US.map((x) => GLOSSARY_MAP[x.nz!].term))].filter((x) => x !== right)).slice(0, 3);
  return mc(rng, right, wrong, `A US textbook says **${e.term.replace(/\s*\(US.*?\)/, "")}**. What's the NZ term?`,
    `**${right}.** ${e.short}`);
}

/* ───────────── C11 owners and business structures ───────────── */

const OWNER = [
  { q: "Aroha transfers $3,500 from the company's account to her own during the month, against what the company owes her.", a: "Drawings", why: "Taking money out during the year reduces her **shareholder current account**. It isn't an expense or income." },
  { q: "At year end the accountant allocates Ben $30,000 for the work he did; it's taxed on his own IR3.", a: "Shareholder salary", why: "A **shareholder salary**: an expense to the company, credited to his current account, and taxed in his hands (no PAYE)." },
  { q: "The directors pay $20,000 of profit to all shareholders in proportion to their shares, with imputation credits attached.", a: "Dividend", why: "A **dividend**: a distribution of profit after tax, from retained earnings, carrying imputation credits for the tax already paid." },
  { q: "Mia is paid every fortnight, with PAYE, KiwiSaver and student loan deducted.", a: "Wages through payroll", why: "An employee's **wages**: PAYE and other deductions are taken out and paid to IRD." },
];
const STRUCT = [
  { q: "Aroha runs the café on her own, with no company. She pays tax on its profit at her personal rates and is personally liable for its debts.", a: "Sole trader", why: "A **sole trader** is the business: no separate legal person and no limited liability." },
  { q: "Aroha and Ben run the café together without a company. Each pays tax on their share of the profit.", a: "Partnership", why: "A **partnership** isn't a separate taxpayer: each partner is taxed on their share, and partners are usually liable for the debts." },
  { q: "The café is a separate legal person that owns its assets, pays 28% tax, and whose owners can only lose what they put in.", a: "Company", why: "A **company** (like Kōwhai Café Ltd): separate legal entity, limited liability, 28% company tax." },
  { q: "A company whose profits and losses pass through to its owners' own tax returns, while they keep limited liability.", a: "Look-through company", why: "A **look-through company (LTC)**: a company for legal purposes, but taxed like a partnership." },
];
function owners(rng: Rng): ChoiceQ {
  return rng() < 0.5
    ? scenario(rng, OWNER, OWNER.map((o) => o.a), "What is this payment? ")
    : scenario(rng, STRUCT, STRUCT.map((o) => o.a), "Which business structure? ");
}

/* ───────────── C12 is it a transaction? ───────────── */

const YES = "Yes: record it", NO = "No: nothing to record yet";
const TXN = [
  { q: "A customer phones to book catering for next month.", a: NO, why: "Nothing has changed hands yet: no goods, no service, no money. It's recorded when the work is done or a deposit is paid." },
  { q: "Kōwhai sends Southern Roasters an order for next week's beans.", a: NO, why: "An order is a promise. It becomes a transaction when the beans arrive with the tax invoice." },
  { q: "The beans arrive with Southern Roasters' tax invoice, to be paid on the 20th.", a: YES, why: "Kōwhai now has the stock and owes the supplier: debit purchases and GST, credit accounts payable." },
  { q: "Aroha hires a new barista who starts next week.", a: NO, why: "No work has been done or paid for yet. Wages are recorded as they're earned and paid." },
  { q: "Aroha buys a car for her own family with her own savings.", a: NO, why: "The **entity concept**: Aroha's personal money isn't the company's. Only the company's transactions are recorded." },
  { q: "A valuer says the espresso machine would now sell for more than its book value.", a: NO, why: "Assets stay at **historical cost** less depreciation; a valuation isn't a transaction." },
  { q: "The bank takes the monthly loan repayment.", a: YES, why: "Money has left the account: record the interest (an expense) and the principal (reducing the loan)." },
  { q: "On 31 March, the stocktake shows $3,800 of stock on the shelves.", a: YES, why: "A year-end adjustment: closing stock is recorded as an asset and reduces cost of goods sold." },
  { q: "March's power has been used, but the bill won't arrive until April.", a: YES, why: "An **accrued expense**: the cost belongs to March, so it's recorded at year end even without the bill." },
  { q: "A competitor opens a café across the road.", a: NO, why: "It may matter to the business, but nothing has been exchanged, so there's nothing to record." },
];
const isTransaction = (rng: Rng) => scenario(rng, TXN, [YES, NO], "Is it a transaction? ");

export const CLASSIFY_DRILLS: Drill[] = [
  { key: "cash-flow", group: "classify", part: 2, title: "Operating, investing or financing?", icon: "🌊", blurb: "Where does each of Kōwhai's real cash movements go in the cash flow statement?", learn: { href: "/cycle/statements", label: "Step 9 · Financial statements" }, make: cashFlow },
  { key: "equation", group: "classify", part: 1, title: "Effect on the equation", icon: "🟰", blurb: "Does each real transaction push assets, liabilities and equity up, down, or not at all?", learn: { href: "/foundations/accounting-equation", label: "The accounting equation" }, make: equationEffect },
  { key: "tb-errors", group: "classify", part: 2, title: "Trial balance errors", icon: "🔍", blurb: "Will the trial balance catch it? Which CROPOC error is it?", learn: { href: "/cycle/unadjusted-tb", label: "Step 5 · Trial balance" }, make: tbError },
  { key: "bank-rec", group: "classify", part: 2, title: "Bank reconciliation items", icon: "🏦", blurb: "Timing difference, cashbook entry, or the bank's mistake?", learn: { href: "/cycle/bank-reconciliation", label: "Step 6 · Bank reconciliation" }, make: bankRec },
  { key: "temporary", group: "classify", part: 2, title: "Temporary or permanent?", icon: "🔄", blurb: "Which accounts are closed at year end, and which carry on?", learn: { href: "/cycle/closing", label: "Step 10 · Closing" }, make: temporary },
  { key: "capital", group: "classify", part: 3, title: "Capital or revenue?", icon: "🏗️", blurb: "Asset, expense, or low-value write-off?", learn: { href: "/nz/depreciation", label: "Depreciation" }, make: capital },
  { key: "gst-type", group: "classify", part: 3, title: "Standard, zero-rated or exempt?", icon: "🏷️", blurb: "The GST treatment of Kōwhai's accounts and everyday situations.", learn: { href: "/nz/gst", label: "GST" }, make: gstType },
  { key: "deductible", group: "classify", part: 3, title: "Deductible for tax?", icon: "✅", blurb: "Fully, 50%, not at all, or later?", learn: { href: "/nz/income-tax", label: "Income tax" }, make: deductible },
  { key: "source-doc", group: "classify", part: 1, title: "Which source document?", icon: "📄", blurb: "Match each real transaction to the document behind it.", learn: { href: "/foundations/source-documents", label: "Source documents" }, make: sourceDoc },
  { key: "transaction", group: "classify", part: 1, title: "Is it a transaction?", icon: "❓", blurb: "Which events get recorded, and which don't (yet)?", learn: { href: "/foundations/what-is-accounting", label: "What accounting is" }, make: isTransaction },
  { key: "owners", group: "classify", part: 1, title: "Owners & business structures", icon: "👥", blurb: "Drawings, salary, dividend or wages? Sole trader, partnership, company or LTC?", learn: { href: "/foundations/business-structures", label: "Business structures" }, make: owners },
  { key: "us-nz", group: "nz", part: 1, title: "US → NZ terms", icon: "🇳🇿", blurb: "Learned from a US textbook? Translate the terms.", learn: { href: "/foundations/us-vs-nz", label: "US vs NZ" }, make: usToNz },
];
