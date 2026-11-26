import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/ui";

/**
 * The accounting system on one diagram: the books (solid boxes, left to right) and the
 * checks and filings that read them (dashed boxes).
 *
 * - live mode (`on`): boxes the current task touches light up (used in "A year on the job")
 * - linked mode (`linked`): every box is a link to the step or topic that explains it
 */
export type FlowNode = "doc" | "journal" | "ledger" | "tb" | "adjust" | "statements" | "close" | "bankrec" | "gst" | "payday" | "tax";

const MAIN: { id: FlowNode; icon: string; label: string; sub: string; href: string; tag: string }[] = [
  { id: "doc", icon: "📄", label: "Source documents", sub: "invoices, Z-reports, payslips", href: "/cycle/identify", tag: "Steps 1–2" },
  { id: "journal", icon: "✍️", label: "Journal", sub: "debits = credits", href: "/cycle/journalise", tag: "Step 3" },
  { id: "ledger", icon: "📒", label: "Ledger", sub: "one account each", href: "/cycle/post", tag: "Step 4" },
  { id: "tb", icon: "⚖️", label: "Trial balance", sub: "does it balance?", href: "/cycle/unadjusted-tb", tag: "Steps 5 & 8" },
  { id: "adjust", icon: "🔧", label: "Adjustments", sub: "accrual basis at 31 Mar", href: "/cycle/adjustments", tag: "Step 7" },
  { id: "statements", icon: "📊", label: "Statements", sub: "P&L, balance sheet", href: "/cycle/statements", tag: "Step 9" },
  { id: "close", icon: "🔒", label: "Close the year", sub: "profit → retained earnings", href: "/cycle/closing", tag: "Steps 10–11" },
];
const SIDE: { id: FlowNode; icon: string; label: string; from: string; when: string; href: string; tag: string }[] = [
  { id: "bankrec", icon: "🏦", label: "Bank reconciliation", from: "checks the ledger's bank account against the statement", when: "every month end", href: "/cycle/bank-reconciliation", tag: "Step 6" },
  { id: "payday", icon: "🧾", label: "Payday filing & PAYE", from: "from each pay run; deductions paid to IRD on the 20th", when: "each payday", href: "/nz/paye", tag: "NZ topic" },
  { id: "gst", icon: "🇳🇿", label: "GST return", from: "from the GST account in the ledger", when: "every 2 months", href: "/nz/gst-return", tag: "NZ topic" },
  { id: "tax", icon: "🏛️", label: "Income tax (IR4)", from: "from the profit in the statements", when: "after year end", href: "/nz/income-tax", tag: "NZ topic" },
];

function Shell({ href, className, children }: { href?: string; className: string; children: ReactNode }) {
  return href ? (
    <Link href={href} className={cx(className, "group hover:border-kowhai-500 hover:bg-kowhai-50 hover:shadow-sm")}>{children}</Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

const Tag = ({ children }: { children: ReactNode }) => (
  <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-kowhai-700">{children}</span>
);

export function SystemFlow({ on, linked = false, note }: { on?: Set<FlowNode>; linked?: boolean; note?: ReactNode }) {
  const lit = (id: FlowNode) => on?.has(id) ?? false;
  return (
    <div>
      <div className="flex flex-wrap items-stretch gap-x-1 gap-y-2">
        {MAIN.map((m, i) => (
          <div key={m.id} className="flex items-center gap-1">
            <Shell
              href={linked ? m.href : undefined}
              className={cx("block rounded-xl border px-3 py-2 transition-colors duration-300", lit(m.id) ? "border-kowhai-500 bg-kowhai-100 shadow-sm" : "border-stone-200 bg-white")}
            >
              {linked && <Tag>{m.tag}</Tag>}
              <span className={cx("block text-sm font-semibold", lit(m.id) ? "text-ink" : "text-stone-600", linked && "text-ink group-hover:underline")}><span className="mr-1">{m.icon}</span>{m.label}</span>
              <span className="block text-[11px] leading-tight text-stone-500">{m.sub}</span>
            </Shell>
            {i < MAIN.length - 1 && <span className="px-0.5 text-stone-400" aria-hidden>→</span>}
          </div>
        ))}
        <div className="flex items-center gap-1"><span className="px-0.5 text-stone-400" aria-hidden>↺</span><span className="text-xs text-stone-500">new year</span></div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SIDE.map((s) => (
          <Shell
            key={s.id}
            href={linked ? s.href : undefined}
            className={cx("block rounded-xl border border-dashed px-3 py-2 transition-colors duration-300", lit(s.id) ? "border-kowhai-500 bg-kowhai-100" : "border-stone-300 bg-stone-50")}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className={cx("text-sm font-semibold", lit(s.id) ? "text-ink" : "text-stone-600", linked && "text-ink group-hover:underline")}>
                {linked && <Tag>{s.tag}</Tag>}
                <span className="mr-1">{s.icon}</span>{s.label}
              </span>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-stone-400">{s.when}</span>
            </span>
            <span className="block text-[11px] leading-tight text-stone-500">{s.from}</span>
          </Shell>
        ))}
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Solid boxes are the books themselves, in the order the work flows. Dashed boxes are checks and filings that <em>read</em> the books. {note}
      </p>
    </div>
  );
}
