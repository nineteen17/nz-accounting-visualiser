/**
 * "Pay yourself": Kōwhai's year 2 (the 2028 income year) with a different choice of shareholder salaries
 * and dividend. Every starting figure comes from the year 2 books; the tax maths is lib/nz/payYourself.ts.
 * Plan: docs/PAY-YOURSELF.md.
 */
import { balances } from "@/lib/engine/ledger";
import { r2 } from "@/lib/money";
import { accLevy, companyTax, dividendShare, MAX_IC_RATIO, maxFullyImputed, ownerYear } from "@/lib/nz/payYourself";
import { PAYROLL_2027_28 } from "@/lib/nz/rates";
import { ACCOUNTS } from "../chartOfAccounts";
import { BOOKKEEPING_RATE, SHAREHOLDERS } from "../business";
import * as Y2 from "./year2";
import { LINES } from "./cashForecast";

export type Choice = { aroha: number; ben: number; dividend: number };

/** year 2 is the 2028 income year: its rates (some still to confirm) */
export const RATES = PAYROLL_2027_28;

const actualSalaries = r2(Y2.SALARIES.reduce((s, x) => s + x.salary, 0));
/** what the café actually chose */
export const ACTUAL: Choice = { aroha: Y2.SALARIES[0].salary, ben: Y2.SALARIES[1].salary, dividend: Y2.DIVIDEND.cash };

/* the year-end balance sheet as it really was (liabilities are credits, so negative in `balances`) */
const ye = balances(Y2.LEDGER);
const of = (type: string, subtype?: string) => r2(ACCOUNTS.filter((a) => a.type === type && (!subtype || a.subtype === subtype)).reduce((s, a) => s + (ye[a.code] ?? 0), 0));
const leo = Y2.RAISED.find((e) => e.id === "leo")!;
const ben = SHAREHOLDERS.find((s) => s.id === "ben")!;
const outflows = LINES.filter((l) => ["suppliers", "employees", "loan"].includes(l.key)).reduce((s, l) => s + l.actual, 0);

export const BASE = {
  /** taxable income before any shareholder salary */
  taxableBeforeSalaries: r2(Y2.TAX.taxableIncome + actualSalaries),
  /** accounting profit before tax and before shareholder salaries */
  profitBeforeSalaries: r2(Y2.PROFIT_BEFORE_TAX + actualSalaries),
  actualTax: Y2.TAX.tax,
  /** imputation credits available when the dividend was paid */
  ica: Y2.DIVIDEND.icaBefore,
  maxFullyImputed: maxFullyImputed(Y2.DIVIDEND.icaBefore),
  bank: r2(ye["100"] ?? 0),
  assets: of("asset"),
  liabilities: r2(-of("liability")),
  current: r2(-of("liability", "current-liability")),
  /** three months of the café's usual spending (suppliers, staff, loan), from year 2's actual cash */
  buffer: r2(-outflows / 4),
  /** what Ben's work would cost to employ someone for: café shifts at Leo's rate, plus bookkeeping */
  benWorth: r2((ben.hours.cafe * leo.rate + ben.hours.books * BOOKKEEPING_RATE) * 52),
  leoRate: leo.rate,
};

export type Result = ReturnType<typeof payYourself>;

export function payYourself(c: Choice) {
  const salaries = r2(c.aroha + c.ben);
  const taxable = r2(BASE.taxableBeforeSalaries - salaries);
  const tax = companyTax(taxable);
  const wanted = c.dividend * MAX_IC_RATIO;
  const credits = r2(Math.min(wanted, BASE.ica));
  const owners = SHAREHOLDERS.map((s) => {
    const salary = s.id === "aroha" ? c.aroha : c.ben;
    const dividend = dividendShare(c.dividend * s.pct, credits * s.pct);
    return { ...s, ...ownerYear({ salary, dividend, otherIncome: s.otherIncome, rates: RATES }), acc: accLevy(salary, RATES) };
  });
  const profitAfterTax = r2(BASE.profitBeforeSalaries - salaries - tax);

  // year end: the differences from what really happened
  const dSal = salaries - actualSalaries, dTax = tax - BASE.actualTax, dDiv = c.dividend - ACTUAL.dividend;
  const bank = r2(BASE.bank - dDiv);
  const assets = r2(BASE.assets - dDiv);
  const liabilities = r2(BASE.liabilities + dSal + dTax);
  const current = r2(BASE.current + dSal + dTax);

  const ownersTax = r2(owners.reduce((s, o) => s + o.personalTax, 0));
  const acc = r2(owners.reduce((s, o) => s + o.acc, 0));
  return {
    choice: c,
    salaries,
    company: {
      taxable,
      /** a tax loss to carry forward when salaries exceed taxable income */
      loss: taxable < 0 ? r2(-taxable) : 0,
      tax,
      profitAfterTax,
      /** profit kept in the company this year */
      kept: r2(profitAfterTax - c.dividend),
      credits,
      fullyImputed: wanted <= BASE.ica + 0.01,
    },
    owners,
    totals: {
      companyTax: tax,
      ownersTax,
      acc,
      /** all the tax and levies on the year's profit (the kept part only at 28% so far) */
      tax: r2(tax + ownersTax + acc),
      ownersKeep: r2(owners.reduce((s, o) => s + o.keeps, 0)),
    },
    yearEnd: {
      bank,
      assets,
      liabilities,
      current,
      /** Companies Act s 4(1)(b): assets more than liabilities */
      solvent: assets > liabilities,
      /** s 4(1)(a), tested strictly: the bank covers everything due, the owners' current accounts included */
      liquid: bank >= current,
      cashLeft: r2(bank - current),
      /** a buffer for the next three months: below it, directors should worry (ss 135–136) */
      enoughCash: bank - current >= BASE.buffer,
    },
    /** Ben's salary against what his work would cost: over 1.25× needs justifying, over 1.5× risks s GB 25 */
    benRatio: BASE.benWorth ? r2(c.ben / BASE.benWorth) : 0,
  };
}

const round = (n: number, to = 1_000) => Math.floor(n / to) * to;

/** the lowest tax this year, searched in $500 steps: Aroha any salary, Ben no more than his work is worth, no dividend */
function lowestTax(): Choice {
  let best = { c: ACTUAL, t: Infinity };
  const step = 500;
  for (let b = 0; b <= Math.min(BASE.benWorth, BASE.taxableBeforeSalaries); b += step)
    for (let a = 0; a <= BASE.taxableBeforeSalaries - b; a += step) {
      const c = { aroha: a, ben: b, dividend: 0 };
      const t = payYourself(c).totals.tax;
      if (t < best.t - 0.005) best = { c, t };
    }
  return best.c;
}

const allSalaryAroha = round(BASE.taxableBeforeSalaries * (ACTUAL.aroha / (ACTUAL.aroha + ACTUAL.ben)), 1);

export const PRESETS: { key: string; label: string; blurb: string; choice: Choice }[] = [
  { key: "actual", label: "What the café did", blurb: "Salaries of $65,000 and $35,000, and a $20,000 fully imputed dividend.", choice: ACTUAL },
  { key: "all-salary", label: "All salary", blurb: "Pay out the whole taxable income as salary, in the same proportions, so the company pays no tax.", choice: { aroha: allSalaryAroha, ben: r2(BASE.taxableBeforeSalaries - allSalaryAroha), dividend: 0 } },
  { key: "dividend", label: "Dividend only", blurb: "No salaries; the largest dividend the imputation credits can fully cover.", choice: { aroha: 0, ben: 0, dividend: round(BASE.maxFullyImputed) } },
  { key: "keep", label: "Keep it in the company", blurb: "The same salaries, but no dividend: the rest stays in the company.", choice: { ...ACTUAL, dividend: 0 } },
  { key: "lowest", label: "Lowest tax this year", blurb: "Found by trying every salary in $500 steps (Ben's no more than his work is worth). Profit kept in the company is taxed again when it's paid out.", choice: lowestTax() },
];
