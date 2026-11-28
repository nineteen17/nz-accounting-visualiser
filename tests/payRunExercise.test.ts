import { describe, expect, it } from "vitest";
import { PAY_RUN_EXERCISES } from "@/data/study/payRun";
import { netLines } from "@/data/study/entries";
import { calcPay } from "@/lib/nz/payroll";
import { isRight, loadProgress, readAmount, saveProgress, slipLines, type LineKey } from "@/lib/study/payRun";

const keyOf: Partial<Record<LineKey, keyof ReturnType<typeof calcPay>>> = {
  ordinary: "ordinary", holiday: "holidayPay", gross: "gross", paye: "paye", studentLoan: "studentLoan",
  ksEmployee: "ksEmployee", net: "net", ksEmployer: "ksEmployerGross", esct: "esct", ksEmployerNet: "ksEmployerNet",
};

describe("Do a pay run yourself", () => {
  it("has six pay runs, simpler first, the leave runs harder", () => {
    expect(PAY_RUN_EXERCISES).toHaveLength(6);
    expect(PAY_RUN_EXERCISES.filter((e) => e.level === "harder").map((e) => e.key)).toEqual(["y2-leave", "y2-leave-2"]);
  });
  it.each(PAY_RUN_EXERCISES.map((e) => [e.key, e] as const))("%s: the payslip lines reproduce the books' payslips", (_k, ex) => {
    for (const r of ex.run.results) {
      const lines = slipLines({ employee: r.employee, hours: r.hours, rates: ex.rates, esctRate: ex.esct[r.employee.id], leave: ex.leaveId === r.employee.id });
      for (const l of lines) {
        const k = keyOf[l.key];
        if (k) expect(l.want, `${r.employee.id} ${l.key}`).toBeCloseTo(r[k] as number, 2);
      }
    }
  });
  it.each(PAY_RUN_EXERCISES.map((e) => [e.key, e] as const))("%s: the entry is the real one, and the filing dates are right", (_k, ex) => {
    expect(ex.entry.lines).toEqual(netLines(ex.txn).map((l) => expect.objectContaining({ account: l.account, side: l.side, amount: l.amount })));
    expect(new Date(ex.run.date + "T00:00:00Z").getUTCDay()).toBe(3); // payday is a Wednesday
    expect(new Date(ex.eiDue + "T00:00:00Z").getUTCDay()).toBe(5); // so the filing is due on the Friday
    expect(ex.payment.date.slice(8)).toBe("20");
    // the month's payment includes this pay run's deductions
    const thisRun = ex.txn.lines.filter((l) => l.account === "215").reduce((s, l) => s + (l.credit ?? 0), 0);
    expect(ex.payment.amount).toBeGreaterThanOrEqual(thisRun - 0.005);
  });
  it("leave runs use the holiday pay accrual, not wages, for the leave", () => {
    const leave = PAY_RUN_EXERCISES.find((e) => e.key === "y2-leave")!;
    expect(leave.entry.lines.some((l) => l.account === "220" && l.side === "debit")).toBe(true);
    const rest = PAY_RUN_EXERCISES.find((e) => e.key === "y2-leave-2")!;
    expect(rest.entry.lines.some((l) => l.account === "602" && l.side === "debit")).toBe(true);
  });
  it("lines are marked against the learner's own earlier figures", () => {
    const ex = PAY_RUN_EXERCISES[0];
    const mia = ex.run.results.find((r) => r.employee.id === "mia")!;
    const args = { employee: mia.employee, hours: mia.hours, rates: ex.rates, esctRate: ex.esct.mia };
    // a wrong gross: PAYE step 1 is then marked against that gross, not the real one
    const own = slipLines({ ...args, typed: { gross: 2000 } });
    expect(own.find((l) => l.key === "annual")!.want).toBe(52_000);
    expect(isRight(52_000, own.find((l) => l.key === "annual")!.want)).toBe(true);
    expect(readAmount("$1,527.78")).toBe(1527.78);
    expect(readAmount("")).toBeNull();
  });
  it("saved progress survives a reload, keeping the better attempt", () => {
    const mem = new Map<string, string>();
    const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    saveProgress(store, "y1-first", { lines: 20, of: 25, entry: true, filing: 3, done: "2026-11-28" });
    saveProgress(store, "y1-first", { lines: 10, of: 25, entry: false, filing: 1, done: "2026-11-29" });
    expect(loadProgress(store)["y1-first"].lines).toBe(20);
  });
});
