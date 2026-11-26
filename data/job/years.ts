/**
 * Everything "A year on the job" needs for each of the café's years.
 */
import type { Transaction } from "@/lib/engine/types";
import { GST_PERIODS, type GstPeriod } from "@/lib/engine/gst";
import { ALL as Y1_ALL, DURING_YEAR as Y1_DURING } from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { JOB_STEPS, bucketsOf, postingOf, upcomingDeadlines, type JobStep } from "./steps";
import { DEADLINES_Y2, JOB_STEPS_Y2 } from "./steps2";

export type YearNo = 1 | 2;

export interface JobYearData {
  year: YearNo;
  label: string;
  span: string;
  steps: JobStep[];
  posted: Transaction[];
  cum: number[];
  buckets: { key: string; label: string; first: number }[];
  totalEntries: number;
  /** entries that come before the year's first step (year 2: the opening balances) */
  base: Transaction[];
  bankTxns: Transaction[];
  gstTxns: Transaction[];
  periods: GstPeriod[];
  start: string;
  end: string;
  yearEndLabel: string;
  openingLabel: string;
  plPeriod: string;
  loanMonthIndex: number;
  deadlines: (iso: string) => { date: string; label: string }[];
  /** steps that involve income tax (lights up the tax box on the map) */
  taxIds: Set<string>;
}

function make(year: YearNo, steps: JobStep[], rest: Omit<JobYearData, "year" | "steps" | "posted" | "cum" | "buckets">): JobYearData {
  return { year, steps, ...postingOf(steps), buckets: bucketsOf(steps), ...rest };
}

export const JOB_YEARS: Record<YearNo, JobYearData> = {
  1: make(1, JOB_STEPS, {
    label: "Year 1",
    span: "2026–27",
    totalEntries: Y1_ALL.length,
    base: [],
    bankTxns: Y1_DURING,
    gstTxns: Y1_ALL,
    periods: GST_PERIODS,
    start: "2026-04-01",
    end: "2027-03-31",
    yearEndLabel: "31 March 2027",
    openingLabel: "1 April 2026",
    plPeriod: "for the year ended 31 March 2027",
    loanMonthIndex: 12,
    deadlines: (iso) => upcomingDeadlines(iso),
    taxIds: new Set(["TAX-CALC", "ADJ11", "ADJ12", "IR4", "F11"]),
  }),
  2: make(2, JOB_STEPS_Y2, {
    label: "Year 2",
    span: "2027–28",
    totalEntries: Y2.ALL.length,
    base: [Y2.OPENING_ENTRY],
    bankTxns: Y2.LEDGER,
    gstTxns: Y2.LEDGER,
    periods: [GST_PERIODS[5], ...Y2.GST_PERIODS_Y2],
    start: "2027-04-01",
    end: "2028-03-31",
    yearEndLabel: "31 March 2028",
    openingLabel: "1 April 2027",
    plPeriod: "for the year ended 31 March 2028",
    loanMonthIndex: 24,
    deadlines: (iso) => DEADLINES_Y2.filter((d) => d.date > iso).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3),
    taxIds: new Set(["TAX-CALC", "Y2-ADJ09", "Y2-ADJ10", "IR4", "IR4-Y1", "B08", "B15", "B17", "B18", "TERMINAL-Y1", "PROV-3"]),
  }),
};
