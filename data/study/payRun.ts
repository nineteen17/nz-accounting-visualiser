/**
 * "Do a pay run yourself": six of Kōwhai's real pay runs, simpler first. Everything comes from the books
 * (data/books/generator.ts); the payslip lines are lib/study/payRun.ts. Plan: docs/PAY-RUN.md.
 */
import { ALL as Y1_ALL } from "@/data/books";
import { esctRates, payRuns, type PayRun } from "@/data/books/generator";
import { YEAR1 } from "@/data/books/year";
import { ALL as Y2_ALL, YEAR2 } from "@/data/books/year2";
import type { YearConfig } from "@/data/books/generator";
import type { Transaction } from "@/lib/engine/types";
import type { PayrollRates } from "@/lib/nz/rates";
import { entryQuestion } from "./entries";
import { seeded, type EntryQ } from "./core";

export type PayRunExercise = {
  key: string;
  year: string;
  title: string;
  /** what's new in this pay run, for the picker */
  blurb: string;
  level: "simpler" | "harder";
  run: PayRun;
  rates: PayrollRates;
  esct: Record<string, number>;
  /** the employee on annual leave this pay, if any */
  leaveId?: string;
  txn: Transaction;
  entry: EntryQ;
  /** employment information (payday filing) is due 2 working days after payday: Kōwhai pays on Wednesdays, so Friday */
  eiDue: string;
  /** the monthly payment to IRD that includes this pay run's deductions */
  payment: { date: string; amount: number; month: string };
};

const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

function make(key: string, year: string, cfg: YearConfig, all: Transaction[], date: string, title: string, blurb: string, level: "simpler" | "harder"): PayRunExercise {
  const run = payRuns(cfg).find((r) => r.date === date)!;
  const txn = all.find((t) => t.book === "payroll" && t.date === date)!;
  const month = date.slice(0, 7);
  const pay = all.find((t) => t.id === `PAYE-${month}`)!;
  return {
    key, year, title, blurb, level, run, rates: cfg.rates, esct: esctRates(cfg),
    leaveId: cfg.payExtras?.[date]?.leave?.employeeId,
    txn, entry: entryQuestion(seeded(7000 + Number(date.replace(/-/g, "")) % 997), txn),
    eiDue: addDays(date, 2),
    payment: { date: pay.date, amount: pay.lines[0].debit!, month },
  };
}

export const PAY_RUN_EXERCISES: PayRunExercise[] = [
  make("y1-first", "Year 1", YEAR1, Y1_ALL, "2026-04-22", "The first pay run",
    "Everything, once: gross pay, PAYE with the earners' levy and the IETC, student loan, KiwiSaver, ESCT and Leo's 8% holiday pay.", "simpler"),
  make("y1-summer", "Year 1", YEAR1, Y1_ALL, "2026-12-02", "Leo's busy summer",
    "Leo works 44 hours instead of 30. His pay and deductions change; Mia's stay the same.", "simpler"),
  make("y2-new-year", "Year 2", YEAR2, Y2_ALL, "2027-04-07", "The first pay of a new tax year",
    "New rates from 1 April 2027: the ACC earners' levy rises to 1.83%.", "simpler"),
  make("y2-rise", "Year 2", YEAR2, Y2_ALL, "2027-04-21", "Pay rises",
    "Mia goes from $26 to $27 an hour and Leo from $24.50 to $25.50.", "simpler"),
  make("y2-leave", "Year 2", YEAR2, Y2_ALL, "2027-07-28", "Mia's annual leave",
    "Mia's leave pay comes out of last year's holiday pay accrual, not wages.", "harder"),
  make("y2-leave-2", "Year 2", YEAR2, Y2_ALL, "2028-02-23", "The rest of Mia's leave",
    "The holiday pay accrual runs out partway, and the rest is this year's expense.", "harder"),
];
