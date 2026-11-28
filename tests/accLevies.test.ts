import { describe, expect, it } from "vitest";
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { balances } from "@/lib/engine/ledger";
import { ACC_CAFE_LEVIES, COMPANIES_OFFICE } from "@/lib/nz/rates";

const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.005);
const A1 = Y1.YEAR_FACTS.acc;
const A2 = Y2.YEAR2_FACTS.acc;
const item = (items: { label: string; amount: number }[], re: RegExp) => items.find((i) => re.test(i.label))?.amount ?? 0;

describe("ACC levies in the books", () => {
  it("year 1: the year's work and working safer levies are accrued, on the staff's earnings and the shareholder salaries", () => {
    const b = balances(Y1.BEFORE_CLOSING);
    near(b["606"], A1.accrual);
    near(A1.accrual, A1.staff + A1.shareholders);
    near(A1.shareholders, Y1.YEAR_FACTS.salaryTotal * (ACC_CAFE_LEVIES.work + ACC_CAFE_LEVIES.workingSafer));
    // no invoice and no GST in year 1
    expect(Y1.DURING_YEAR.some((t) => t.lines.some((l) => l.account === "606"))).toBe(false);
  });

  it("year 1: s EF 3 adds the whole accrual back, so taxable income is what it would be without it", () => {
    near(item(Y1.TAX.items, /ACC levies accrued/), A1.accrual);
    near(Y1.TAX.taxableIncome, 60_163.26);
    near(Y1.TAX.terminal, 13_742.08);
  });

  it("year 2: ACC's July invoice clears last year's staff accrual and charges this year's provisional levy, plus GST", () => {
    const inv = Y2.DURING_YEAR.find((t) => t.id === "B20")!;
    const line = (code: string) => inv.lines.find((l) => l.account === code)!;
    near(line("205").debit!, A1.staff);
    near(line("606").debit!, A2.provisional);
    near(line("210").debit!, A2.invoiceGst);
    near(A2.invoiceGst, A2.invoiceEx * 0.15);
    near(A2.provisional, A1.staffEarnings * (ACC_CAFE_LEVIES.next.work + ACC_CAFE_LEVIES.next.workingSafer));
    // paid with August's supplier run, at least 30 days after the invoice (Accident Compensation Act s 168)
    const paid = Y2.DURING_YEAR.find((t) => t.date > inv.date && t.lines.some((l) => l.account === "200" && l.debit && l.party === "ACC"))!;
    expect(paid.date).toBe("2027-08-20");
    expect((Date.parse(paid.date) - Date.parse(inv.date)) / 86_400_000).toBeGreaterThanOrEqual(30);
  });

  it("year 2: the deduction is what ACC invoiced this year, not the accounts' expense", () => {
    const b = balances(Y2.BEFORE_CLOSING);
    const deducted = b["606"] - item(Y2.TAX.items, /ACC levies accrued/) - item(Y2.TAX.items, /last year's ACC/);
    near(b["606"], A2.provisional + A2.accrual);
    near(deducted, A2.invoiceEx);
  });

  it("the shareholders' earners' levy never reaches the company's expenses", () => {
    near(A2.accrual, A2.washUp + A2.shareholders);
    near(A2.shareholders, 100_000 * A2.rate);
    expect(A2.shareholderEarnersLevy).toBeGreaterThan(A2.shareholders);
  });

  it("at 31 March 2028 accrued expenses still hold both years' shareholder levies and the wash-up", () => {
    const b = balances([Y2.OPENING_ENTRY, ...Y2.BEFORE_CLOSING]);
    const power = Y2.ADJUSTMENTS.find((t) => t.id !== "Y2-ADJ-ACC" && t.lines.some((l) => l.account === "205" && l.credit))!;
    const powerAccrual = power.lines.find((l) => l.account === "205")!.credit!;
    near(-b["205"], A2.shareholdersY1 + A2.accrual + powerAccrual);
  });
});

describe("the Companies Office annual return", () => {
  it("is paid in April 2027, the first after registration, with GST claimed", () => {
    const t = Y2.DURING_YEAR.find((x) => x.id === "B19")!;
    expect(t.date.slice(0, 7)).toBe("2027-04");
    near(t.lines.find((l) => l.account === "620")!.debit!, COMPANIES_OFFICE.annualReturnFee);
    near(t.lines.find((l) => l.account === "210")!.debit!, Y2.YEAR2_FACTS.annualReturn.incl - COMPANIES_OFFICE.annualReturnFee);
    expect(Y1.ALL.some((x) => /annual return/i.test(x.title))).toBe(false);
  });
});
