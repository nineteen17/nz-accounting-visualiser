"use client";

import { useState } from "react";
import Link from "next/link";
import { GLOSSARY, type GlossaryEntry } from "@/data/glossary";
import { useOverlay } from "@/components/learn/Overlay";
import { cx } from "@/lib/ui";

const CATS: Record<GlossaryEntry["category"], string> = {
  basics: "Basics",
  recording: "Recording",
  adjustments: "Accruals & adjustments",
  statements: "Statements & the cycle",
  gst: "GST",
  payroll: "Payroll",
  tax: "Tax",
  business: "Business structures",
  us: "🇺🇸 US → NZ terms",
};

export function GlossaryList() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const { openTerm } = useOverlay();
  const list = GLOSSARY.filter((e) => (cat === "all" || e.category === cat) && (!q || `${e.term} ${e.short}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => a.term.localeCompare(b.term));
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms…" className="min-w-64 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2" />
      </div>
      <div className="mb-6 flex flex-wrap gap-1">
        {[["all", "All"], ...Object.entries(CATS)].map(([k, v]) => (
          <button key={k} onClick={() => setCat(k)} className={cx("rounded-lg px-3 py-1 text-sm", cat === k ? "bg-ink text-white" : "bg-white hover:bg-stone-100")}>{v}</button>
        ))}
      </div>
      {cat === "us" && (
        <p className="mb-4 rounded-xl bg-sky-50 px-4 py-3 text-sm">
          These are terms from American (US GAAP) material. Each one points to its NZ equivalent. For every difference in one place, see{" "}
          <Link href="/us-vs-nz" className="font-semibold underline">US GAAP vs NZ →</Link>
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((e) => (
          <button key={e.key} onClick={() => openTerm(e.key)} className="rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-kowhai-500 hover:shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{e.term}</span>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-stone-400">{CATS[e.category]}</span>
            </div>
            <div className="mt-1 text-sm text-stone-600">{e.short.replace(/\*\*/g, "")}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
