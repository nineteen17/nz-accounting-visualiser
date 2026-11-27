/**
 * Drills for the lessons that had flashcards but no practice: the adjusted trial balance (worksheet),
 * the post-closing trial balance, employment basics, ACC levies, and RWT / FBT / withholding tax.
 * Balances come from Kōwhai's real books; rates come from lib/nz/rates.ts; the rules are the ones the lessons teach.
 */
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { balances } from "@/lib/engine/ledger";
import { ACC_EARNERS_LEVY, MINIMUM_WAGE, RECORD_KEEPING_YEARS, RWT } from "@/lib/nz/rates";
import { $, $$, article, int, mc, num, pct, pick, r2, type Drill, type Question, type Rng } from "./core";

const ACC = Object.fromEntries(ACCOUNTS.map((a) => [a.code, a]));
const side = (bal: number) => (bal >= 0 ? "debit" : "credit");
const has = (bal: number | undefined) => Math.abs(bal ?? 0) > 0.004;

/* ───────────── the two years' trial balances ───────────── */

export const YEARS = [
  { label: "31 March 2027 (year 1)", unadj: balances(Y1.DURING_YEAR), adj: balances(Y1.BEFORE_CLOSING), post: balances(Y1.ALL), profit: Y1.NET_PROFIT, adjTxns: Y1.ADJUSTMENTS },
  { label: "31 March 2028 (year 2)", unadj: balances([Y2.OPENING_ENTRY, ...Y2.DURING_YEAR]), adj: balances([Y2.OPENING_ENTRY, ...Y2.BEFORE_CLOSING]), post: balances([Y2.OPENING_ENTRY, ...Y2.ALL]), profit: Y2.NET_PROFIT, adjTxns: Y2.ADJUSTMENTS },
];

/* ───────────── adjusted trial balance: the worksheet ───────────── */

export const COLUMNS = { pd: "Profit & loss: debit", pc: "Profit & loss: credit", bd: "Balance sheet: debit", bc: "Balance sheet: credit" } as const;

/** where an account's adjusted balance goes on the worksheet */
export function worksheetColumn(code: string, bal: number): keyof typeof COLUMNS {
  const t = ACC[code].type;
  if (t === "income" || t === "expense") return bal >= 0 ? "pd" : "pc";
  return bal >= 0 ? "bd" : "bc";
}

function worksheet(rng: Rng): Question {
  const y = pick(rng, YEARS);
  if (rng() < 0.5) {
    const code = pick(rng, ACCOUNTS.filter((a) => a.code !== "320" && has(y.adj[a.code])).map((a) => a.code));
    const bal = y.adj[code], a = ACC[code], col = worksheetColumn(code, bal);
    const pl = col === "pd" || col === "pc";
    return mc(rng, COLUMNS[col], Object.values(COLUMNS), `On the worksheet at ${y.label}, **${a.name}** has an adjusted ${side(bal)} balance of ${$(Math.abs(bal))}. Which column does it go in?`,
      `${a.name} is ${a.contra ? "a contra " : `${article(a.type)} `}${a.type} account, so it belongs on the **${pl ? "profit & loss" : "balance sheet"}**${pl ? ": income and expenses make the profit" : ": assets, liabilities and equity are what's left at year end"}. It has a ${side(bal)} balance, so it goes in the **${side(bal)}** column. See [[adjusted-trial-balance]].`);
  }
  // an account the adjusting entries changed
  const changed = ACCOUNTS.filter((a) => a.code !== "320" && Math.abs((y.adj[a.code] ?? 0) - (y.unadj[a.code] ?? 0)) > 0.004 && has(y.adj[a.code])
    && (!has(y.unadj[a.code]) || side(y.unadj[a.code]) === side(y.adj[a.code])));
  const a = pick(rng, changed);
  const before = y.unadj[a.code] ?? 0, after = y.adj[a.code];
  let dr = 0, cr = 0;
  for (const t of y.adjTxns) for (const l of t.lines) if (l.account === a.code) { dr += l.debit ?? 0; cr += l.credit ?? 0; }
  dr = r2(dr); cr = r2(cr);
  const moves = [dr ? `debit it ${$(dr)}` : "", cr ? `credit it ${$(cr)}` : ""].filter(Boolean).join(" and ");
  const s = side(after);
  return num(`At ${y.label}, before any adjustments, **${a.name}** has ${has(before) ? `a ${side(before)} balance of ${$(Math.abs(before))}` : "no balance"}. The year-end [[adjusting-entry|adjusting entries]] ${moves}.\n\nWhat's its **adjusted balance**? (It's a ${s} balance.)`, r2(Math.abs(after)),
    `${working(before, dr, cr, s)} = **${$(Math.abs(after))} ${s}**. On a ${s} balance, ${s}s add and ${s === "debit" ? "credits" : "debits"} subtract. This is the figure on the [[adjusted-trial-balance]] and in the statements.`);
}

/** "$1,000.00 + $200.00 − $50.00", read from the side the balance ends up on */
function working(before: number, dr: number, cr: number, s: "debit" | "credit") {
  const start = has(before) ? $(Math.abs(before)) : "$0.00";
  const plus = (amt: number, onSide: "debit" | "credit") => (amt ? ` ${onSide === s ? "+" : "−"} ${$(amt)} ${onSide}` : "");
  return `${start}${plus(dr, "debit")}${plus(cr, "credit")}`;
}

/* ───────────── post-closing trial balance ───────────── */

function postClosing(rng: Rng): Question {
  const y = pick(rng, YEARS);
  const r = rng();
  if (r < 0.35) {
    const before = -(y.adj["310"] ?? 0), after = -(y.post["310"] ?? 0);
    return num(`At ${y.label}, before closing, **Retained earnings** has a ${before >= 0 ? "credit" : "debit"} balance of ${$(Math.abs(before))}. The year's profit after tax is ${$(y.profit)}.\n\nWhat's retained earnings on the [[post-closing-trial-balance|post-closing trial balance]]?`, r2(after),
      `Closing moves the profit through the [[income-summary]] into retained earnings: ${before >= 0 ? $(before) : `−${$(-before)}`} + ${$(y.profit)} = **${$(after)}** (credit).${y.label.includes("2028") ? " The opening balance already has year 1's profit in it, less the dividend paid this year." : ""} See [[closing-entries]].`);
  }
  const a = pick(rng, ACCOUNTS.filter((x) => x.code !== "320" && has(y.adj[x.code])));
  const bal = y.adj[a.code];
  const temp = a.type === "income" || a.type === "expense";
  if (r < 0.7) {
    return mc(rng, temp ? "No: it's closed to $0" : `Yes: ${$(Math.abs(bal))} ${side(bal)}${a.code === "310" ? ", plus the profit" : ""}`, temp ? [`Yes: ${$(Math.abs(bal))} ${side(bal)}`, "Yes, but moved to the balance sheet"] : ["No: it's closed to $0", "No: it moves to retained earnings"],
      `At ${y.label}, **${a.name}** has a ${side(bal)} balance of ${$(Math.abs(bal))} before closing. Is it on the [[post-closing-trial-balance|post-closing trial balance]]?`,
      temp
        ? `${a.name} is ${a.type === "income" ? "income" : "an expense"}: a [[temporary-accounts|temporary account]] that only measures this year. Closing empties it into the income summary, so it starts next year at $0 and isn't on the post-closing trial balance.`
        : `${a.name} is ${a.type === "equity" ? "equity" : `a${a.type === "asset" ? "n" : ""} ${a.type}`}: a permanent, balance sheet account, so it carries into next year${a.code === "310" ? ". Retained earnings also picks up the year's profit from the income summary" : " unchanged by closing"}.`);
  }
  // what closing does to the trial balance totals
  const total = (b: Record<string, number>) => r2(ACCOUNTS.reduce((t, x) => t + Math.max(0, b[x.code] ?? 0), 0));
  const before = total(y.adj), after = total(y.post);
  return mc(rng, "Smaller: the expense balances are gone", ["The same: closing doesn't change the totals", "Larger: the profit is added", "Smaller: the asset balances are closed"],
    `Kōwhai's adjusted trial balance at ${y.label} has debits of ${$(before)}. After closing, will the [[post-closing-trial-balance|post-closing trial balance]] totals be the same?`,
    `**Smaller**: ${$(after)} each side. Closing empties every expense (debit) and income (credit) account; the profit, the difference between them, lands in retained earnings. What's left is only the balance sheet: assets on the debit side, liabilities and equity (and contra accounts like accumulated depreciation) on the credit side.`);
}

/* ───────────── employment basics ───────────── */

function employment(rng: Rng): Question {
  const w = MINIMUM_WAGE;
  const r = int(rng, 0, 7);
  if (r === 0) {
    const hours = int(rng, 8, 40);
    return num(`A new adult employee works **${hours} hours** this week at the adult [[minimum-wage]]. What's the least Kōwhai can pay them, before deductions?`, r2(hours * w.adult),
      `${hours} × ${$(w.adult)} (the adult minimum from ${w.from}) = **${$(r2(hours * w.adult))}**.`);
  }
  if (r === 1) {
    const rate = r2(w.adult + pick(rng, [-1.45, -0.6, -0.2, 0.05, 0.55, 2.05]));
    const ok = rate >= w.adult;
    return mc(rng, ok ? "Yes, it's at or above the adult minimum" : "No, it's below the adult minimum", ["Yes, it's at or above the adult minimum", "No, it's below the adult minimum"],
      `Kōwhai offers a new 25-year-old barista **${$(rate)} an hour**. Is that legal?`,
      `The adult minimum wage is ${$(w.adult)} an hour from ${w.from}, so ${$(rate)} is ${ok ? "fine" : "too low"}. (The starting-out and training rate, ${$(w.startingOut)}, is 80% of the adult rate and only applies to some new or young workers or those in training.)`);
  }
  if (r === 2) return mc(rng, "No: the minimum applies after deductions for the employer's benefit", ["Yes, if the employee agrees in writing", "Yes, it's a business cost", "Only for part-time staff"],
    `Leo earns just over the minimum wage. Can Kōwhai deduct the cost of his uniform if that takes his pay below the minimum?`,
    "No. The minimum wage applies **after** any deductions the employer makes for its own benefit, so a uniform deduction can't push pay below it.");
  if (r === 3) return mc(rng, "6 years", ["7 years", "3 years", "10 years"],
    "How long must Kōwhai keep **wage, time, holiday and leave records**?",
    `6 years (Employment Relations Act 2000 s 130; Holidays Act 2003 s 81). Other business records, like invoices and the ledger, are kept for **${RECORD_KEEPING_YEARS} years** for IRD.`);
  if (r === 4) return mc(rng, `${RECORD_KEEPING_YEARS} years`, ["6 years", "3 years", "10 years"],
    "How long must Kōwhai keep its **business records** (invoices, receipts, bank statements, the ledger) for IRD?",
    `**${RECORD_KEEPING_YEARS} years**. Wage, time and leave records are the exception at 6 years, under employment law.`);
  if (r === 5) return mc(rng, "The real nature of the relationship", ["What the contract calls them", "Whether they charge GST", "How many hours they work"],
    "Kōwhai hires someone and calls them a contractor. What decides whether they're **really an employee**?",
    "The **real nature of the relationship**, not the label. Employees get PAYE, KiwiSaver, leave and the minimum wage; contractors invoice and pay their own tax. Getting it wrong means arrears, often for years.");
  if (r === 6) {
    const [form, what] = pick(rng, [["IR330", "Tax code declaration"], ["KS1", "KiwiSaver deduction form"]] as const);
    return mc(rng, what, ["Tax code declaration", "KiwiSaver deduction form", "Employment agreement", "GST registration"].filter((x) => x !== what),
      `A new employee fills in an **${form}**. What is it?`,
      `The **IR330** is the employee's tax code declaration (it sets their PAYE); the **KS1** is the KiwiSaver deduction form. Kōwhai keeps both, along with a signed employment agreement for every employee.`);
  }
  return mc(rng, "A signed written employment agreement", ["A verbal agreement is enough", "Only an offer letter", "Nothing until they've passed a trial"],
    "What must Kōwhai have for **every** employee before they start?",
    "A **signed written employment agreement**. Kōwhai also keeps their IR330, KS1, proof of the right to work in NZ, and wage, time and leave records.");
}

/* ───────────── ACC levies ───────────── */

function accLevies(rng: Rng): Question {
  const L = ACC_EARNERS_LEVY;
  const r = int(rng, 0, 4);
  if (r <= 1) {
    const earn = rng() < 0.25 ? int(rng, 160, 220) * 1_000 : int(rng, 30, 120) * 1_000;
    const liable = Math.min(earn, L.maxLiableEarnings), levy = r2(liable * L.rate);
    return num(`An employee earns **${$$(earn)}** in the 2026–27 year. How much ACC [[acc-earners-levy|earners' levy]] is deducted through PAYE over the year?`, levy,
      `The levy is ${pct(L.rate, 2)} of earnings, up to maximum liable earnings of ${$$(L.maxLiableEarnings)}. ${earn > L.maxLiableEarnings ? `${$$(earn)} is over the cap, so it's ${$$(L.maxLiableEarnings)}` : $$(earn)} × ${pct(L.rate, 2)} = **${$(levy)}**.`);
  }
  if (r === 2) return mc(rng, "It's included in PAYE, deducted from the employee's pay", ["ACC invoices Kōwhai for it", "The employee pays ACC directly", "Kōwhai pays it on top of wages"],
    "How is an employee's ACC **earners' levy** paid?",
    "It's part of **PAYE**: deducted from the employee's pay and paid to IRD with the rest. There's no separate entry. (It funds cover for injuries outside work.)");
  if (r === 3) return mc(rng, "ACC invoices the business once a year, based on its payroll and industry", ["It's deducted from wages with PAYE", "It's added to the GST return", "Only self-employed people pay it"],
    "How does Kōwhai pay the ACC **work levy**?",
    "ACC sends an **invoice** once a year, based on total payroll and the business's levy risk classification (cafés have their own). The first one is provisional and squared up later. It funds cover for injuries at work.");
  return mc(rng, "Debit an ACC levies expense (and the GST), credit accounts payable or bank", ["Debit PAYE payable, credit bank", "Debit wages, credit ACC payable", "No entry: it's part of PAYE"],
    "Kōwhai receives its ACC work levy invoice. What's the entry?",
    "It's a business expense: **debit an ACC levies expense account** (and GST, since the work levy is GST-inclusive and the GST is claimable), **credit accounts payable** (or bank, if paid straight away). Kōwhai's first invoice arrives in year 2, based on year 1's earnings.");
}

/* ───────────── RWT, FBT and withholding tax ───────────── */

const TAX_KIND = { rwt: "Resident withholding tax (RWT)", fbt: "Fringe benefit tax (FBT)", wht: "Schedular payments withholding tax", none: "None of these" } as const;
const OTHER_TAX: [keyof typeof TAX_KIND, string, string][] = [
  ["rwt", "Kōwhai's bank pays interest on its savings account.", "The bank deducts **RWT** from the interest before paying it (28% for a company). Kōwhai claims it as a credit against its income tax."],
  ["rwt", "Kōwhai pays its shareholders a dividend.", "Kōwhai must deduct **dividend RWT**: 33% of the gross dividend, less the imputation credits attached."],
  ["fbt", "Ben takes the company van home every night and can use it privately.", "Private use of a work vehicle is a **fringe benefit**, so Kōwhai pays **FBT** (unless it's a restricted work-related vehicle)."],
  ["fbt", "Kōwhai pays for a staff member's gym membership.", "A non-cash benefit to an employee: **FBT** is payable by the employer."],
  ["fbt", "Aroha's shareholder current account is overdrawn and Kōwhai charges no interest.", "That's a low-interest loan to a shareholder-employee: **FBT** (or a deemed dividend)."],
  ["wht", "Kōwhai pays a contract cleaner whose work is on the schedular payments list, and the cleaner has no exemption certificate.", "Kōwhai must deduct **schedular payments withholding tax** (usually 10–20%) and file it through payday filing, like PAYE."],
  ["wht", "Kōwhai pays a company director a director's fee.", "Directors' fees are **schedular payments**: withholding tax is deducted."],
  ["none", "Staff get free coffee while they're on shift.", "Small on-premises benefits like this are generally **not** subject to FBT."],
  ["none", "Kōwhai pays Mia her normal wages.", "Wages have **PAYE** deducted, not any of these."],
  ["none", "Kōwhai pays an invoice from a plumber who isn't on the schedular payments list.", "Ordinary contractors invoice and pay their own tax: **nothing** is withheld."],
];

function otherTaxes(rng: Rng): Question {
  if (rng() < 0.2) {
    const interest = int(rng, 20, 400) * 5;
    return num(`Kōwhai's bank credits **${$$(interest)}** of interest (before tax) to its savings account. How much **RWT** does the bank deduct? (Kōwhai is a company.)`, r2(interest * RWT.companyDefault),
      `Companies default to ${pct(RWT.companyDefault, 0)}: ${$$(interest)} × ${pct(RWT.companyDefault, 0)} = **${$(r2(interest * RWT.companyDefault))}**. Kōwhai records the full interest as income and the RWT as a tax credit (RWT credits, an asset) that reduces its income tax. See [[rwt]].`);
  }
  const [k, scenario, why] = pick(rng, OTHER_TAX);
  return mc(rng, TAX_KIND[k], Object.values(TAX_KIND), `${scenario} Which of these taxes applies?`, why);
}

export const GAP_DRILLS: Drill[] = [
  { key: "worksheet", group: "classify", part: 2, title: "The worksheet", icon: "🗂️", blurb: "Adjusted balances and where each one goes: profit & loss or balance sheet, debit or credit.", learn: { href: "/cycle/adjusted-tb", label: "Step 8 · Adjusted TB" }, make: worksheet },
  { key: "post-closing", group: "classify", part: 2, title: "After closing", icon: "🏁", blurb: "What's left on the post-closing trial balance, and retained earnings after the profit goes in.", learn: { href: "/cycle/post-closing", label: "Step 11 · New year" }, make: postClosing },
  { key: "employment", group: "classify", part: 3, title: "Employment basics", icon: "🤝", blurb: "Minimum wage, deductions, records, employee or contractor, IR330 and KS1.", learn: { href: "/nz/employment", label: "Employment" }, make: employment },
  { key: "acc", group: "calculate", part: 3, title: "ACC levies", icon: "🩹", blurb: "The earners' levy in PAYE (with its cap) and the work levy invoice.", learn: { href: "/nz/acc", label: "ACC levies" }, make: accLevies },
  { key: "other-taxes", group: "classify", part: 3, title: "RWT, FBT or withholding tax?", icon: "🧾", blurb: "Which tax applies: interest, dividends, the work van, contractors, directors' fees.", learn: { href: "/nz/other-taxes", label: "Other taxes" }, make: otherTaxes },
];
