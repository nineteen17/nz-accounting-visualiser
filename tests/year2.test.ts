import { describe, expect, it } from "vitest";
import { ALL as Y1_ALL, TAX as Y1_TAX, YEAR_FACTS as Y1_FACTS } from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { GLOSSARY_MAP } from "@/data/glossary";
import { JOB_YEARS } from "@/data/job/years";
import { balances, equation, isBalanced, trialBalance } from "@/lib/engine/ledger";
import { GST_PERIODS, gstReturn } from "@/lib/engine/gst";
import { balanceSheet, cashFlowDirect, cashFlowIndirect } from "@/lib/engine/statements";
import { bankReconciliation } from "@/lib/engine/bankrec";
import { lastDay, monthsBetween } from "@/data/books/helpers";

const cents = (x = 0) => Math.round(x * 100);
const y1End = balances(Y1_ALL);
const y2End = balances(Y2.WITH_OPENING);

describe("year 2: opening balances", () => {
  it("open exactly where year 1 closed", () => {
    const open = balances([Y2.OPENING_ENTRY]);
    for (const a of ACCOUNTS) expect(cents(open[a.code]), a.code).toBe(cents(y1End[a.code]));
  });
  it("carry forward only permanent accounts", () => {
    for (const a of ACCOUNTS.filter((a) => a.temporary)) expect(cents(Y2.OPENING_BALANCES[a.code]), a.code).toBe(0);
  });
});

describe("year 2: the journal", () => {
  it("every entry balances, and ids are unique across both years", () => {
    expect(Y2.ALL.filter((t) => !isBalanced(t)).map((t) => t.id)).toEqual([]);
    const ids = Y2.LEDGER.map((t) => t.id);
    expect(ids.length - new Set(ids).size).toBe(0);
  });
  it("every entry is dated inside the year", () => {
    for (const t of Y2.ALL) expect(t.date >= "2027-04-01" && t.date <= "2028-03-31", t.id).toBe(true);
  });
  it("trial balance, equation and balance sheet balance at year end", () => {
    const tb = trialBalance(y2End);
    expect(cents(tb.debit)).toBe(cents(tb.credit));
    const eq = equation(y2End);
    expect(cents(eq.assets)).toBe(cents(eq.liabilities + eq.equity + eq.profit));
    expect(balanceSheet(y2End, { splitLoan: true, loanMonthIndex: 24 }).balanced).toBe(true);
  });
  it("closing leaves every temporary account at zero", () => {
    for (const a of ACCOUNTS.filter((a) => a.temporary)) expect(cents(y2End[a.code]), a.code).toBe(0);
  });
  it("reversals undo last year's accruals and prepayment", () => {
    const after = balances([Y2.OPENING_ENTRY, ...Y2.ALL.filter((t) => t.id.startsWith("REV-"))]);
    for (const code of ["125", "136", "206"]) expect(cents(after[code]), code).toBe(0);
    // accrued expenses keep last year's ACC levies: they aren't reversed, ACC's invoice clears them
    expect(cents(after["205"])).toBe(cents(-Y1_FACTS.acc.accrual));
  });
});

describe("year 2: tax and IRD", () => {
  it("pays last year's final GST return, and ends owing this year's final return", () => {
    const p6 = Y2.ALL.find((t) => t.id === "GST-P6")!;
    expect(cents(p6.lines[0].debit)).toBe(cents(gstReturn(Y1_ALL, GST_PERIODS[5]).box15));
    expect(cents(-y2End["210"])).toBe(cents(gstReturn(Y2.ALL, Y2.GST_PERIODS_Y2[5]).box15));
  });
  it("income tax payable = last year's terminal tax + this year's tax − instalments paid", () => {
    expect(cents(-y2End["230"])).toBe(cents(Y1_TAX.terminal + Y2.TAX.tax - Y2.YEAR2_FACTS.provisionalPaid));
    expect(cents(y2End["141"])).toBe(0);
  });
  it("provisional tax is last year's RIT + 5% in three instalments", () => {
    expect(cents(Y2.PROVISIONAL.total)).toBe(cents(Y1_TAX.residual * 1.05));
    expect(cents(Y2.PROVISIONAL.instalments.reduce((s, i) => s + i.amount, 0))).toBe(cents(Y2.PROVISIONAL.total));
  });
  it("the dividend is fully imputed, within the ICA, with 33% RWT", () => {
    const d = Y2.DIVIDEND;
    expect(cents(d.ic)).toBe(cents((d.cash * 28) / 72));
    expect(d.ic).toBeLessThanOrEqual(d.icaBefore);
    expect(Y2.YEAR2_FACTS.icaClosing).toBeGreaterThanOrEqual(0);
    for (const s of d.shares) expect(cents(s.ic + s.rwt)).toBe(cents(s.gross * 0.33));
    expect(cents(y2End["216"])).toBe(0);
  });
  it("holiday pay accrued last year is used before any new expense", () => {
    const leave = Y2.ALL.filter((t) => t.lines.some((l) => l.account === "220" && l.debit));
    expect(cents(leave.reduce((s, t) => s + t.lines.filter((l) => l.account === "220").reduce((a, l) => a + (l.debit ?? 0), 0), 0))).toBe(cents(-y1End["220"]));
  });
});

describe("year 2: cash", () => {
  it("bank reconciles every month", () => {
    for (const m of monthsBetween("2027-04", "2028-03")) expect(bankReconciliation(Y2.LEDGER, `${m}-01`, lastDay(m)).ok, m).toBe(true);
  });
  it("direct and indirect cash flows agree, and explain the change in cash", () => {
    const d = cashFlowDirect(Y2.ALL), i = cashFlowIndirect(Y2.BEFORE_CLOSING);
    expect(cents(d.sections[0].total)).toBe(cents(i.operating));
    const cash = (b: Record<string, number>) => (b["100"] ?? 0) + (b["105"] ?? 0);
    expect(cents(d.net)).toBe(cents(cash(y2End) - cash(y1End)));
  });
});

describe("a year on the job: both years", () => {
  for (const D of Object.values(JOB_YEARS)) {
    const all = D.year === 1 ? Y1_ALL : Y2.ALL;
    it(`year ${D.year}: posts every entry once and ends with the full books`, () => {
      const ids = D.posted.map((t) => t.id);
      expect([...ids].sort()).toEqual(all.map((t) => t.id).sort());
      const a = balances([...D.base, ...D.posted]), b = balances([...D.base, ...all]);
      for (const a2 of ACCOUNTS) expect(cents(a[a2.code]), a2.code).toBe(cents(b[a2.code]));
    });
    it(`year ${D.year}: unique step ids, valid repeats and glossary links`, () => {
      expect(new Set(D.steps.map((s) => s.id)).size).toBe(D.steps.length);
      D.steps.forEach((s, i) => { if (s.repeatOf !== undefined) expect(s.repeatOf, s.id).toBeLessThan(i); });
      D.steps.forEach((s) => { if (s.repeatOf !== undefined) expect(s.repeatOf, s.id).toBeGreaterThanOrEqual(0); });
      const missing = new Set<string>();
      for (const s of D.steps) for (const m of [s.intro, ...s.txns.flatMap((t) => [t.story, ...(t.notes ?? [])])].join("\n").matchAll(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g)) if (!GLOSSARY_MAP[m[1]]) missing.add(m[1]);
      expect([...missing]).toEqual([]);
    });
    it(`year ${D.year}: entries during the year are in date order`, () => {
      const during = D.steps.filter((s) => s.phase === "during").flatMap((s) => s.txns);
      for (let i = 1; i < during.length; i++) expect(during[i].date >= during[i - 1].date, during[i].id).toBe(true);
    });
  }
});
