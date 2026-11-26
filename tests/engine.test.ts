import { describe, expect, it } from "vitest";
import { ALL, BEFORE_CLOSING, DURING_YEAR, NET_PROFIT, TAX, PROFIT_BEFORE_TAX } from "@/data/books";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { balances, equation, isBalanced, trialBalance } from "@/lib/engine/ledger";
import { GST_PERIODS, gstReturn } from "@/lib/engine/gst";
import { balanceSheet, cashFlowDirect, cashFlowIndirect, profitAndLoss } from "@/lib/engine/statements";
import { bankReconciliation } from "@/lib/engine/bankrec";
import { calcPay, payeForPay } from "@/lib/nz/payroll";
import { EMPLOYEES } from "@/data/business";

const c = (x: number) => Math.round(x * 100);

describe("journal", () => {
  it("every transaction balances", () => {
    for (const t of ALL) expect(isBalanced(t), `${t.id} ${t.title}`).toBe(true);
  });
  it("ids are unique and accounts exist", () => {
    const ids = new Set<string>();
    const codes = new Set(ACCOUNTS.map((a) => a.code));
    for (const t of ALL) {
      expect(ids.has(t.id), t.id).toBe(false);
      ids.add(t.id);
      for (const l of t.lines) expect(codes.has(l.account), `${t.id} ${l.account}`).toBe(true);
    }
  });
  it("the accounting equation holds after every transaction", () => {
    for (let i = 1; i <= ALL.length; i++) {
      const e = equation(balances(ALL.slice(0, i)));
      expect(c(e.assets), ALL[i - 1].id).toBe(c(e.liabilities) + c(e.equity));
    }
  });
  it("bank and till never go negative", () => {
    for (let i = 1; i <= DURING_YEAR.length; i++) {
      const b = balances(DURING_YEAR.slice(0, i));
      expect(b["100"], DURING_YEAR[i - 1].id).toBeGreaterThanOrEqual(0);
      expect(b["105"], DURING_YEAR[i - 1].id).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("trial balances & statements", () => {
  it("adjusted TB balances", () => {
    const tb = trialBalance(balances(BEFORE_CLOSING));
    expect(c(tb.debit)).toBe(c(tb.credit));
  });
  it("closing entries empty all temporary accounts", () => {
    const b = balances(ALL);
    for (const a of ACCOUNTS.filter((x) => x.temporary)) expect(c(b[a.code]), a.name).toBe(0);
  });
  it("P&L profit matches the closing entry", () => {
    const pl = profitAndLoss(balances(BEFORE_CLOSING));
    expect(c(pl.profitAfterTax)).toBe(c(NET_PROFIT));
    expect(c(pl.profitBeforeTax)).toBe(c(PROFIT_BEFORE_TAX));
    expect(NET_PROFIT).toBeGreaterThan(0);
  });
  it("balance sheet balances (before and after closing)", () => {
    expect(balanceSheet(balances(BEFORE_CLOSING), { splitLoan: true }).balanced).toBe(true);
    expect(balanceSheet(balances(ALL), { splitLoan: true }).balanced).toBe(true);
  });
  it("direct and indirect cash flow agree with the change in cash", () => {
    const b = balances(ALL);
    const cash = b["100"] + b["105"];
    const direct = cashFlowDirect(ALL);
    expect(c(direct.net)).toBe(c(cash));
    const ind = cashFlowIndirect(BEFORE_CLOSING);
    expect(c(ind.operating)).toBe(c(direct.sections[0].total));
  });
});

describe("GST", () => {
  it("GST control balance equals the unpaid P6 return", () => {
    const r6 = gstReturn(ALL, GST_PERIODS[5]);
    const b = balances(ALL);
    expect(c(-b["210"])).toBe(c(r6.box15));
  });
  it("box arithmetic", () => {
    for (const p of GST_PERIODS) {
      const r = gstReturn(ALL, p);
      expect(c(r.box10)).toBe(c(r.box8) + c(r.box9));
      expect(Math.abs(c(r.box7 * 3 / 23) - c(r.box8))).toBeLessThanOrEqual(1);
    }
  });
});

describe("bank reconciliation", () => {
  it("reconciles March", () => {
    const r = bankReconciliation(ALL, "2027-03-01", "2027-03-31");
    expect(r.ok).toBe(true);
    expect(r.depositsInTransit.length).toBe(1);
    expect(r.unpresented.length).toBe(1);
    expect(r.bankOnly.length).toBe(1);
  });
});

describe("payroll", () => {
  it("net pay + deductions = gross", () => {
    for (const e of EMPLOYEES) {
      const p = calcPay(e, 80);
      expect(c(p.net) + c(p.paye) + c(p.studentLoan) + c(p.ksEmployee)).toBe(c(p.gross));
      expect(c(p.ksEmployerNet) + c(p.esct)).toBe(c(p.ksEmployerGross));
    }
  });
  it("PAYE on $1,000/fortnight M code is sensible", () => {
    const p = payeForPay(1000, "M");
    // annual 26,000: 15,600 @10.5% + 10,400 @17.5% = 3,458 + ACC 455 → /26
    expect(p.paye).toBeCloseTo((3458 + 455) / 26, 1);
  });
  it("tax computed", () => {
    expect(TAX.tax).toBeGreaterThan(0);
  });
});

import { GLOSSARY, GLOSSARY_MAP } from "@/data/glossary";
describe("glossary links", () => {
  it("every [[term]] in transactions and glossary exists", () => {
    const texts = [
      ...ALL.flatMap((t) => [t.story, ...(t.notes ?? []), t.gstNote ?? ""]),
      ...GLOSSARY.map((g) => g.body),
    ];
    const missing = new Set<string>();
    for (const s of texts) for (const m of s.matchAll(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g)) if (!GLOSSARY_MAP[m[1]]) missing.add(m[1]);
    for (const g of GLOSSARY) if (g.nz && !GLOSSARY_MAP[g.nz]) missing.add(g.nz);
    expect([...missing]).toEqual([]);
  });
});

import { JOB_STEPS, JOB_POSTED } from "@/data/job/steps";
describe("a year on the job", () => {
  it("posts every journal entry exactly once", () => {
    const ids = JOB_POSTED.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ALL.map((t) => t.id).sort());
  });
  it("ends with the same books as the full journal", () => {
    const a = balances(JOB_POSTED);
    const b = balances(ALL);
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) expect(Math.round((a[k] ?? 0) * 100)).toBe(Math.round((b[k] ?? 0) * 100));
  });
  it("step ids are unique and every [[term]] in explanations exists", () => {
    expect(new Set(JOB_STEPS.map((s) => s.id)).size).toBe(JOB_STEPS.length);
    const missing = new Set<string>();
    for (const s of JOB_STEPS) for (const m of s.intro.matchAll(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g)) if (!GLOSSARY_MAP[m[1]]) missing.add(m[1]);
    expect([...missing]).toEqual([]);
  });
  it("never posts an entry before an earlier-dated one during the year (except bank-rec finds)", () => {
    const during = JOB_STEPS.filter((s) => s.phase === "during").flatMap((s) => s.txns);
    for (let i = 1; i < during.length; i++) expect(during[i].date >= during[i - 1].date).toBe(true);
  });
});
