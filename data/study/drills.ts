/**
 * Auto-marked drills for the study tool. Every question is generated from the café's own books,
 * chart of accounts, glossary and NZ rules, so there's an endless supply and the answers always
 * agree with the rest of the app. Each question explains WHY the answer is right.
 */
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { ADJUSTMENTS, DURING_YEAR } from "@/data/books";
import { DURING_YEAR as Y2_DURING } from "@/data/books/year2";
import { GLOSSARY, type GlossaryEntry } from "@/data/glossary";
import { PROVISIONAL_TAX } from "@/lib/nz/rates";
import type { Account } from "@/lib/engine/types";
import { $, article, int, mc, num, nzDate, pick, r2, shuffle, type Drill } from "./core";
import { ENTRY_DRILLS } from "./entries";
import { CALC_DRILLS } from "./calc";

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
    blurb: "GST, PAYE, payday filing and provisional tax dates.",
    learn: { href: "/glossary/memory-aids", label: "Memory aids: NZ dates" },
    make(rng) {
      const kind = pick(rng, ["gst", "gst", "paye", "payday", "provisional"] as const);
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

export const DRILLS: Drill[] = [...ENTRY_DRILLS, ...CALC_DRILLS, ...BASIC_DRILLS];
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
