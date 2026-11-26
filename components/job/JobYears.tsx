"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JOB_YEARS, type YearNo } from "@/data/job/years";
import { nzDate } from "@/lib/money";
import { cx } from "@/lib/ui";
import { JobYear } from "./JobYear";

const BLURB: Record<YearNo, string> = {
  1: "Setting up, the first sales, payroll, GST, and the first year end.",
  2: "Reversals, provisional tax, annual leave, selling an asset, a dividend, comparatives.",
};

/** Year 1 / Year 2 switch for "A year on the job" (?year=2) */
export function JobYears() {
  const year: YearNo = useSearchParams().get("year") === "2" ? 2 : 1;
  return (
    <>
      <div className="mb-6 grid gap-2 sm:grid-cols-2" role="tablist" aria-label="Which year">
        {([1, 2] as const).map((y) => {
          const D = JOB_YEARS[y];
          const on = y === year;
          return (
            <Link
              key={y}
              href={y === 1 ? "/on-the-job" : "/on-the-job?year=2"}
              role="tab"
              aria-selected={on}
              scroll={false}
              className={cx("rounded-2xl border px-4 py-3 transition", on ? "border-ink bg-ink text-white" : "border-stone-200 bg-white hover:border-kowhai-500")}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-bold">{D.label} <span className={cx("font-semibold", on ? "text-kowhai-300" : "text-stone-500")}>{D.span}</span></span>
                <span className={cx("text-xs", on ? "text-stone-300" : "text-stone-500")}>{nzDate(D.start)} – {nzDate(D.end)}</span>
              </span>
              <span className={cx("mt-0.5 block text-sm", on ? "text-stone-300" : "text-stone-600")}>{D.steps.length} tasks · {BLURB[y]}</span>
            </Link>
          );
        })}
      </div>
      <JobYear key={year} year={year} />
    </>
  );
}
