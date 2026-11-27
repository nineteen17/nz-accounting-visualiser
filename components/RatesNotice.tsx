"use client";

import { useEffect, useState } from "react";
import { CURRENT_PAYROLL, NEXT_RATES_FROM, ratesOutOfDate } from "@/lib/nz/rates";
import { nzDate } from "@/lib/money";
import { todayLocal } from "@/lib/study/srs";

/**
 * A notice that appears by itself once a new income year has started and the site still
 * teaches the old year's rates. It's checked in the visitor's browser, so it needs no server
 * and no rebuild. It goes away when CURRENT_PAYROLL is moved on (README: "Updating the rates").
 */
export function RatesNotice() {
  const [show, setShow] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- today's date is only known in the browser
  useEffect(() => setShow(ratesOutOfDate(todayLocal())), []);
  if (!show) return null;
  return (
    <div role="note" className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      The figures here are for the <strong>{CURRENT_PAYROLL.year}</strong> tax year. New rates apply from {nzDate(NEXT_RATES_FROM)}: check{" "}
      <a className="underline" href="https://www.ird.govt.nz" target="_blank" rel="noreferrer">ird.govt.nz</a> for the current ones.
    </div>
  );
}
