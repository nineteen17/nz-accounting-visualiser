"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cx } from "@/lib/ui";
import { RichText } from "./RichText";

const CALLOUT = {
  why: { icon: "💡", title: "Why?", cls: "border-kowhai-400 bg-kowhai-50" },
  tip: { icon: "✅", title: "Tip", cls: "border-emerald-300 bg-emerald-50" },
  warn: { icon: "⚠️", title: "Watch out", cls: "border-rose-300 bg-rose-50" },
  nz: { icon: "🇳🇿", title: "NZ specific", cls: "border-sky-300 bg-sky-50" },
  example: { icon: "☕", title: "At Kōwhai Café", cls: "border-stone-300 bg-white" },
  rule: { icon: "📏", title: "The rule", cls: "border-violet-300 bg-violet-50" },
};

export function Callout({ kind = "why", title, children }: { kind?: keyof typeof CALLOUT; title?: string; children: ReactNode }) {
  const c = CALLOUT[kind];
  return (
    <div className={cx("my-4 rounded-xl border-l-4 px-4 py-3", c.cls)}>
      <div className="mb-1 text-sm font-semibold">
        <span className="mr-1.5">{c.icon}</span>
        {title ?? c.title}
      </div>
      <div className="text-[15px] leading-relaxed [&>p]:my-1">{typeof children === "string" ? <RichText text={children} /> : children}</div>
    </div>
  );
}

export function Quiz({ q, options, answer, explain }: { q: string; options: string[]; answer: number; explain: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="my-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-700">Check yourself</div>
      <div className="mb-3 font-medium">{q}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <button
            key={i}
            onClick={() => setPicked(i)}
            className={cx(
              "rounded-lg border px-3 py-1.5 text-sm transition",
              picked === null && "border-violet-300 bg-white hover:bg-violet-100",
              picked !== null && i === answer && "border-emerald-500 bg-emerald-100 text-emerald-900",
              picked === i && i !== answer && "border-rose-400 bg-rose-100 text-rose-900",
              picked !== null && i !== answer && picked !== i && "border-stone-200 bg-white opacity-60",
            )}
          >
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className={cx("mt-3 text-sm leading-relaxed", picked === answer ? "text-emerald-800" : "text-rose-800")}>
          <strong>{picked === answer ? "Correct! " : "Not quite. "}</strong>
          <RichText text={explain} inlineOnly />
        </div>
      )}
    </div>
  );
}

export function DeepDives({ links }: { links: { href: string; label: string }[] }) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-3 py-1 text-sm hover:border-ink hover:bg-stone-50">
          📖 {l.label} →
        </Link>
      ))}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && <div className="mb-1 text-sm font-semibold uppercase tracking-wider text-kowhai-700">{eyebrow}</div>}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-3xl text-lg leading-relaxed text-stone-600">{children}</div>}
    </header>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-stone-200 bg-white p-5 shadow-sm", className)}>{children}</div>;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx("rounded-lg px-3 py-1.5 text-sm font-medium transition", value === t.id ? "bg-white shadow-sm" : "text-stone-600 hover:text-ink")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Collapsed one-line note for learners coming from US (GAAP) material. */
export function UsNote({ children }: { children: ReactNode }) {
  return (
    <details className="group my-4 rounded-xl border border-stone-200 bg-white text-[15px] open:border-sky-300 open:bg-sky-50/50">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-sm font-semibold text-stone-600 hover:text-ink [&::-webkit-details-marker]:hidden">
        <span aria-hidden>🇺🇸</span> Coming from a US textbook?
        <span className="ml-auto text-stone-400 transition group-open:rotate-90" aria-hidden>▸</span>
      </summary>
      <div className="space-y-2 px-4 pb-3 leading-relaxed text-stone-700">
        {children}
        <Link href="/us-vs-nz" className="inline-block text-sm font-semibold text-sky-700 underline">All US vs NZ differences →</Link>
      </div>
    </details>
  );
}
