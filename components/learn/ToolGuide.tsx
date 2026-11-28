"use client";

import type { ReactNode } from "react";
import { GLOSSARY_MAP } from "@/data/glossary";
import { Term } from "./Term";

/** the glossary's own name for a term, without its bracketed note: "Use-of-money interest (UOMI)" → "Use-of-money interest" */
const nameOf = (k: string) => GLOSSARY_MAP[k]?.term.replace(/\s*\(.*\)$/, "") ?? k;

/**
 * "New here?": the beginner guide at the top of every Explore tool and study exercise.
 * What the tool shows, how to use it step by step, the words you'll meet (each one opens its glossary entry),
 * and how to read the main table. Open by default; a learner who knows it can fold it away.
 */
export function ToolGuide({ what, steps, terms, read }: {
  what: ReactNode;
  steps: ReactNode[];
  terms: { k: string; label?: string; says: ReactNode }[];
  read?: ReactNode;
}) {
  return (
    <details open className="group rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200 sm:p-5">
      <summary className="cursor-pointer list-none font-bold text-sky-900">
        <span aria-hidden className="mr-1.5">🧭</span>New here? How to use this
        <span className="ml-2 text-xs font-normal text-sky-700 group-open:hidden">(show)</span>
        <span className="ml-2 hidden text-xs font-normal text-sky-700 group-open:inline">(hide)</span>
      </summary>
      <div className="mt-3 grid gap-5 text-[15px] leading-relaxed lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-800">What it shows</div>
            <div className="mt-1">{what}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-800">How to use it</div>
            <ol className="mt-1 list-decimal space-y-1 pl-5">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
          {read && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-sky-800">Reading the results</div>
              <div className="mt-1">{read}</div>
            </div>
          )}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-800">Words you&apos;ll meet <span className="font-normal normal-case tracking-normal">(tap one for more)</span></div>
          <dl className="mt-1 space-y-1.5">
            {terms.map((t) => (
              <div key={t.k}>
                <dt className="inline font-semibold"><Term k={t.k}>{t.label ?? nameOf(t.k)}</Term>: </dt>
                <dd className="inline">{t.says}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </details>
  );
}
