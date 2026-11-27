/**
 * Auto-marked drills for the study tool. Every question is generated from the café's own books,
 * chart of accounts, glossary and NZ rules, so there's an endless supply and the answers always
 * agree with the rest of the app. Each question explains WHY the answer is right.
 */
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { ADJUSTMENTS, DURING_YEAR } from "@/data/books";
import { DURING_YEAR as Y2_DURING } from "@/data/books/year2";
import { GLOSSARY, type GlossaryEntry } from "@/data/glossary";
import { PROVISIONAL_TAX, RECORD_KEEPING_YEARS } from "@/lib/nz/rates";
import type { Account } from "@/lib/engine/types";
import { $, article, int, mc, num, nzDate, pick, r2, shuffle, type Drill } from "./core";
import { ENTRY_DRILLS } from "./entries";
import { CALC_DRILLS } from "./calc";
import { CLASSIFY_DRILLS } from "./classify";
import { ORDER_DRILLS } from "./order";
import { GAP_DRILLS } from "./gaps";
import { BUDGET_DRILLS } from "./budget";

export type { Drill, Question, Rng } from "./core";
/** any drill's key */
export type DrillKey = string;

/* ───────────── accounts ───────────── */

/** accounts a learner should be able to classify (not the closing-only helpers) */
export const DRILL_ACCOUNTS = ACCOUNTS.filter((a) => !["320", "519"].includes(a.code));
const TYPE_LABEL: Record<Account["type"], string> = { asset: "Asset", liability: "Liability", equity: "Equity", income: "Income", expense: "Expense" };
const TYPE_WHY: Record<Account["type"], string> = {
  asset: "something the café owns or is owed",
  liability: "something the café owes to someone else",
  equity: "the owners' stake in the café",
  income: "money the café earns",
  expense: "a cost used up in earning income",
};

/* ───────────── journal lines for "debit or credit?" ───────────── */

const LINES = [...DURING_YEAR, ...ADJUSTMENTS, ...Y2_DURING].flatMap((t) =>
  t.lines.filter((l) => ((l.debit ?? 0) > 0 || (l.credit ?? 0) > 0) && l.account !== "519").map((l) => ({ t, l })),
);
const ACC = Object.fromEntries(ACCOUNTS.map((a) => [a.code, a]));


const BASIC_DRILLS: Drill[] = [
  {
    key: "debit-credit", group: "record", title: "Debit or credit?", icon: "⚖️", part: 1,
    blurb: "A real line from Kōwhai's journal: is it a debit or a credit?",
    learn: { href: "/foundations/debits-credits", label: "Debits & credits" },
    make(rng) {
      const { t, l } = pick(rng, LINES);
      const a = ACC[l.account];
      const side = (l.debit ?? 0) > 0 ? "Debit" : "Credit";
      const amount = l.debit || l.credit || 0;
      const up = (side === "Debit") === (a.normal === "debit");
      const typeName = TYPE_LABEL[a.type].toLowerCase();
      const explain =
        `**${a.name}** is ${article(typeName)} ${typeName}${a.contra ? " (a contra account, so it works the opposite way)" : ""}. ` +
        `Here it goes **${up ? "up" : "down"}**, and it goes up with a **${a.normal}**${up ? "" : `, so going down is a ${a.normal === "debit" ? "credit" : "debit"}`}. ` +
        `So it's a **${side.toLowerCase()}**.` + (l.why && l.why.length > 40 ? `\n\n${l.why}` : "");
      return mc(rng, side, side === "Debit" ? ["Credit"] : ["Debit"],
        `**${t.title}** (${nzDate(t.date)})\n\nThe **${a.name}** line for **${$(amount)}**: debit or credit?`, explain);
    },
  },
  {
    key: "element", group: "classify", title: "Which element?", icon: "🧩", part: 1,
    blurb: "Name the type of account: asset, liability, equity, income or expense.",
    learn: { href: "/foundations/five-elements", label: "The five elements" },
    make(rng) {
      const a = pick(rng, DRILL_ACCOUNTS);
      const correct = TYPE_LABEL[a.type];
      return mc(rng, correct, Object.values(TYPE_LABEL), `Kōwhai's account **${a.code} ${a.name}**: which of the five elements is it?`,
        `It's **${correct.toLowerCase()}**: ${TYPE_WHY[a.type]}. ${a.description}` + (a.contra ? "\n\nIt's a contra account: it sits with the assets but reduces them." : ""));
    },
  },
  {
    key: "current", group: "classify", title: "Current or non-current?", icon: "⏳", part: 2,
    blurb: "Will it turn into cash, or have to be paid, within 12 months?",
    learn: { href: "/cycle/statements", label: "Step 9 · Financial statements" },
    make(rng) {
      const a = pick(rng, DRILL_ACCOUNTS.filter((x) => /current/.test(x.subtype)));
      const current = !a.subtype.startsWith("non-");
      const kind = a.type === "asset" ? (current ? "turns into cash or gets used up" : "lasts") : (current ? "must be paid" : "is due");
      const extra = a.code === "250" ? " The part repaid in the next 12 months is moved to current liabilities on the balance sheet." : "";
      return mc(rng, current ? "Current" : "Non-current", ["Current", "Non-current"],
        `On the balance sheet, is **${a.name}** current or non-current?`,
        `**${current ? "Current" : "Non-current"}**: it ${kind} ${current ? "within" : "beyond"} the next 12 months.${extra} ${a.description}`);
    },
  },
  {
    key: "statement", group: "classify", title: "Which statement?", icon: "📊", part: 2,
    blurb: "Does the account belong on the profit & loss or the balance sheet?",
    learn: { href: "/cycle/statements", label: "Step 9 · Financial statements" },
    make(rng) {
      const a = pick(rng, DRILL_ACCOUNTS);
      const pl = a.type === "income" || a.type === "expense";
      return mc(rng, pl ? "Profit & loss" : "Balance sheet", ["Profit & loss", "Balance sheet"],
        `Where does **${a.name}** appear in Kōwhai's financial statements?`,
        pl
          ? `It's ${a.type === "income" ? "**income**" : "an **expense**"}, so it's on the **profit & loss**: the movie of the year's performance. It's reset to zero at year end.`
          : `It's ${a.type === "equity" ? "**equity**" : a.type === "asset" ? "an **asset**" : "a **liability**"}, so it's on the **balance sheet**: the photo of what the café has, owes and is worth on one day. Its balance carries on into next year.`);
    },
  },
  {
    key: "gst", group: "calculate", title: "GST maths", icon: "🧾", part: 3,
    blurb: "Type the GST in a price, the price with GST added, or the price before GST.",
    learn: { href: "/nz/gst", label: "GST" },
    make(rng) {
      const ex = rng() < 0.5 ? pick(rng, [4.5, 5, 6, 8.5, 12, 38.5, 80, 120, 200, 460, 1000, 2400, 3650]) : int(rng, 2, 1200) * 5;
      const inc = r2(ex * 1.15), gst = r2(ex * 0.15);
      const kind = pick(rng, ["find", "add", "remove"] as const);
      if (kind === "find") {
        return num(`A GST-inclusive price of **${$(inc)}**. How much of it is GST?`, gst,
          `Multiply by **3/23**: ${$(inc)} × 3/23 = **${$(gst)}**, leaving ${$(ex)} before GST. Taking 15% of the inclusive price (${$(r2(inc * 0.15))}) is the classic mistake: the 15% applies to the price **before** GST.`);
      }
      if (kind === "add") {
        return num(`A price of **${$(ex)}** before GST. What's the GST-inclusive price?`, inc,
          `Multiply by **1.15**: ${$(ex)} × 1.15 = **${$(inc)}** (${$(gst)} of GST). 3/23 is only for finding the GST **inside** a price that already includes it.`);
      }
      return num(`A GST-inclusive price of **${$(inc)}**. What's the price before GST?`, ex,
        `Divide by **1.15**: ${$(inc)} ÷ 1.15 = **${$(ex)}**. Taking 15% off (${$(r2(inc * 0.85))}) removes too much, because the GST is 15% of the smaller, pre-GST price.`);
    },
  },
  {
    key: "deadlines", group: "nz", title: "When is it due?", icon: "📅", part: 3,
    blurb: "The NZ tax calendar: GST, PAYE, payday filing, KiwiSaver, provisional and terminal tax, the IR4, the annual return.",
    learn: { href: "/glossary/memory-aids", label: "Memory aids: NZ dates" },
    make(rng) {
      const kind = pick(rng, ["gst", "gst", "gst6", "paye", "payday", "kiwisaver", "provisional", "terminal", "ir4", "annual-return", "records"] as const);
      const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      if (kind === "gst") {
        const end = pick(rng, [4, 6, 8, 10, 0, 2]); // two-monthly periods end in May, Jul, Sep, Nov, Jan, Mar (0-based months)
        const next = MONTHS[(end + 1) % 12];
        const correct = end === 2 ? "7 May" : end === 10 ? "15 January" : `28 ${next}`;
        const why = end === 2 || end === 10
          ? `Normally the 28th of the next month, but a period ending ${end === 2 ? "31 March" : "30 November"} gets extra time because of the holidays: **${correct}**.`
          : `GST returns are due on the **28th of the month after the period ends**, so **${correct}**. (Only periods ending in March and November are different: 7 May and 15 January.)`;
        return mc(rng, correct, [`20 ${next}`, `28 ${next}`, `Last day of ${next}`, `7 ${next}`],
          `Kōwhai's two-monthly GST period ends on the last day of **${MONTHS[end]}**. When are the GST return and payment due?`, why);
      }
      if (kind === "paye") {
        const m = Math.floor(rng() * 12), next = MONTHS[(m + 1) % 12];
        return mc(rng, `20 ${next}`, [`28 ${next}`, `5 ${next}`, `Last day of ${MONTHS[m]}`],
          `Kōwhai deducts PAYE from its pay runs in **${MONTHS[m]}**. By when must it pay that PAYE to IRD?`,
          `By the **20th of the next month**: **20 ${next}**. (That's for employers deducting less than $500,000 a year; bigger employers pay twice a month.)`);
      }
      if (kind === "payday") {
        return mc(rng, "Within 2 working days of payday", ["By the 20th of the next month", "With the next GST return", "Once a year, after balance date"],
          "After a pay run, when must Kōwhai send IRD the **employment information** (payday filing)?",
          "**Within 2 working days of payday.** Don't mix it up with paying the PAYE, which is due by the 20th of the next month.");
      }
      if (kind === "gst6") {
        const sep = rng() < 0.5;
        return mc(rng, sep ? "28 October" : "7 May", sep ? ["28 September", "20 October", "7 November"] : ["28 April", "20 April", "31 May"],
          `A small business files **six-monthly** GST, with a period ending on **${sep ? "30 September" : "31 March"}**. When is the return due?`,
          sep
            ? "**28 October**: the usual rule, the 28th of the month after the period ends. Six-monthly filing is allowed when turnover is under $500,000."
            : "**7 May**: periods ending in March get extra time, the same as two-monthly filers.");
      }
      if (kind === "kiwisaver") {
        return mc(rng, "With the PAYE, by the 20th of the next month", ["Once a year, with the IR4", "Directly to the KiwiSaver provider each payday", "With the GST return"],
          "How do Kōwhai's KiwiSaver deductions and employer contributions get to the KiwiSaver provider?",
          "They're paid to **IRD with the PAYE, by the 20th of the next month**, and IRD passes them on to each employee's provider.");
      }
      if (kind === "terminal") {
        const agent = rng() < 0.5;
        return mc(rng, agent ? "7 April 2028" : "7 February 2028", agent ? ["7 February 2028", "31 March 2028", "7 July 2027"] : ["7 April 2028", "31 March 2028", "7 July 2027"],
          `Kōwhai's year ends 31 March 2027. ${agent ? "It **has a tax agent** (Rata & Co)." : "It **doesn't have a tax agent**."} When is its [[terminal-tax|terminal tax]] due?`,
          `**${agent ? "7 April 2028" : "7 February 2028"}**. Terminal tax is due 7 February after the year ends, or **7 April with a tax agent** who has an extension of time. That's why Kōwhai's year-1 terminal tax is due 7 April 2028.`);
      }
      if (kind === "ir4") {
        const agent = rng() < 0.5;
        return mc(rng, agent ? "31 March 2028" : "7 July 2027", agent ? ["7 July 2027", "7 April 2028", "28 August 2027"] : ["31 March 2028", "7 April 2028", "28 August 2027"],
          `Kōwhai's year ends 31 March 2027. ${agent ? "Its accountant is a **tax agent** with an extension of time." : "It files **without a tax agent**."} When is its **IR4** (company income tax return) due?`,
          `**${agent ? "31 March 2028" : "7 July 2027"}**. An IR4 is due 7 July after the year ends, or **31 March of the following year** when a tax agent has an extension of time.`);
      }
      if (kind === "annual-return") {
        return mc(rng, "Once a year, in the company's allocated filing month", ["7 July, with the IR4", "Within 2 months of balance date", "Only when the directors change"],
          "When does Kōwhai file its **annual return** with the Companies Office?",
          "**Once a year, in the filing month the Companies Office allocated** when the company was registered. It confirms the directors, shareholders and addresses, and it's separate from anything filed with IRD.");
      }
      if (kind === "records") {
        return mc(rng, `${RECORD_KEEPING_YEARS} years`, ["3 years", "5 years", "10 years"],
          "How long must Kōwhai keep its business records, such as invoices, bank statements and payroll?",
          `**${RECORD_KEEPING_YEARS} years**, the IRD requirement for business records.`);
      }
      const correct = PROVISIONAL_TAX.instalments.map((d) => d.replace("August", "Aug").replace("January", "Jan")).join(", ");
      return mc(rng, correct, ["28 Jul, 28 Nov, 28 Mar", "20 Aug, 20 Jan, 20 May", "31 Aug, 31 Dec, 31 Mar"],
        "With a 31 March balance date, when are the three standard **provisional tax** instalments due?",
        `**${correct}**: roughly every four months. All three are also GST due dates, so they're easy to remember together.`);
    },
  },
  {
    key: "match-term", group: "nz", title: "Match the term", icon: "📖", part: 1,
    blurb: "Pick the right meaning for an essential or working-knowledge term.",
    learn: { href: "/glossary", label: "Glossary" },
    make(rng) {
      const pool = GLOSSARY.filter((e) => e.level !== "reference" && e.category !== "us");
      const e = pick(rng, pool);
      const same = shuffle(rng, pool.filter((x) => x.key !== e.key && x.category === e.category));
      const other = shuffle(rng, pool.filter((x) => x.key !== e.key && x.category !== e.category));
      const wrong = [...same, ...other].slice(0, 3).map((x) => plain(x.short));
      return mc(rng, plain(e.short), wrong, `What does **${e.term}** mean?`,
        `**${e.term}**: ${plain(e.short)}` + (e.example ? `\n\n☕ ${e.example}` : ""));
    },
  },
];

export const DRILLS: Drill[] = [...ENTRY_DRILLS, ...CALC_DRILLS, ...BASIC_DRILLS, ...CLASSIFY_DRILLS, ...ORDER_DRILLS, ...GAP_DRILLS, ...BUDGET_DRILLS];
export const DRILL_MAP: Record<string, Drill> = Object.fromEntries(DRILLS.map((d) => [d.key, d]));

/** glossary text without **bold** or [[link|label]] markup, for answer buttons */
export function plain(s: string) {
  return s.replace(/\*\*/g, "").replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1");
}

/** hide the term itself in its definition, for "meaning → term" cards */
export function maskTerm(e: GlossaryEntry, text: string) {
  const names = [e.term, e.term.replace(/\s*\(.*\)\s*$/, ""), ...(e.term.match(/\(([^)]+)\)/)?.[1].split(/,|\bor\b/) ?? [])]
    .map((x) => x.trim())
    .filter((x) => x.length > 2)
    .sort((a, b) => b.length - a.length);
  let out = text;
  for (const n of names) out = out.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "▁▁▁▁");
  return out;
}
