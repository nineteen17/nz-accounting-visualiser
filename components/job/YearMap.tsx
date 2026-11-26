"use client";

import { JOB_STEPS, type JobStep } from "@/data/job/steps";
import { nzDate } from "@/lib/money";
import { cx } from "@/lib/ui";
import { SystemFlow, type FlowNode } from "@/components/job/SystemFlow";

/* ───────────── 1. The flow: where each job sits in the system ───────────── */

function nodesFor(s: JobStep): Set<FlowNode> {
  const n = new Set<FlowNode>();
  const id = s.id;
  if (s.txns.length) { n.add("journal"); n.add("ledger"); }
  if (s.txns.some((t) => t.doc)) n.add("doc");
  if (s.phase === "during" && s.txns.length) n.add("doc");
  if (id.startsWith("REC-")) n.add("bankrec");
  if (id.startsWith("GSTRET") || id.startsWith("GST-")) n.add("gst");
  if (s.category === "payroll" || id.startsWith("PAYE-")) n.add("payday");
  if (id.startsWith("TB-")) n.add("tb");
  if (id.startsWith("ADJ")) n.add("adjust");
  if (id === "BALANCE-DATE") { n.add("doc"); n.add("adjust"); }
  if (id === "TAX-CALC" || id === "ADJ11" || id === "ADJ12" || id === "IR4" || id === "F11") n.add("tax");
  if (id === "STATEMENTS" || id === "ANNUAL-RETURN") n.add("statements");
  if (id.startsWith("CL")) n.add("close");
  return n;
}

function Flow({ step }: { step: JobStep }) {
  return <SystemFlow on={nodesFor(step)} note="The parts lit up in yellow are what this task touches." />;
}

/* ───────────── 2. The year: every task on one timeline ───────────── */

const LANES = [
  { id: "sales", label: "Sales & banking" },
  { id: "bills", label: "Bills & payments" },
  { id: "payroll", label: "Payroll" },
  { id: "ird", label: "IRD (GST, PAYE, tax)" },
  { id: "checks", label: "Checks" },
  { id: "oneoff", label: "One-off events" },
  { id: "ye", label: "Year end" },
] as const;
type Lane = (typeof LANES)[number]["id"];

function laneOf(s: JobStep): Lane {
  if (s.id.startsWith("REC-") || s.id.startsWith("TB-")) return "checks";
  switch (s.category) {
    case "sales": case "banking": return "sales";
    case "purchases": case "payments": case "monthly": return "bills";
    case "payroll": return "payroll";
    case "tax": return "ird";
    case "setup": case "event": return "oneoff";
    default: return "ye";
  }
}

const W = 1000, LABEL = 150, TOP = 22, ROW = 22;
const X_DURING = [LABEL + 6, 655] as const;
const X_YE = [672, 938] as const;
const X_AFTER = [952, 992] as const;
const H = TOP + LANES.length * ROW + 8;

const START = Date.UTC(2026, 3, 1), END = Date.UTC(2027, 2, 31);
const dayX = (iso: string) => {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return X_DURING[0] + ((t - START) / (END - START)) * (X_DURING[1] - X_DURING[0]);
};

const POINTS = (() => {
  const ye = JOB_STEPS.map((s, i) => ({ s, i })).filter((p) => p.s.phase === "year-end");
  const af = JOB_STEPS.map((s, i) => ({ s, i })).filter((p) => p.s.phase === "after");
  const spread = (k: number, n: number, [a, b]: readonly [number, number]) => (n <= 1 ? (a + b) / 2 : a + (k / (n - 1)) * (b - a));
  return JOB_STEPS.map((s, i) => {
    const x = s.phase === "during" ? dayX(s.date) : s.phase === "year-end" ? spread(ye.findIndex((p) => p.i === i), ye.length, X_YE) : spread(af.findIndex((p) => p.i === i), af.length, X_AFTER);
    const lane = LANES.findIndex((l) => l.id === laneOf(s));
    return { i, x, y: TOP + lane * ROW + ROW / 2, big: !s.skippable, s };
  });
})();

const MONTHS = Array.from({ length: 12 }, (_, k) => {
  const d = new Date(Date.UTC(2026, 3 + k, 1));
  return { x: dayX(d.toISOString().slice(0, 10)), label: d.toLocaleDateString("en-NZ", { month: "short", timeZone: "UTC" }) };
});

function Timeline({ idx, onJump }: { idx: number; onJump: (i: number) => void }) {
  const cur = POINTS[idx];
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[720px] w-full select-none" role="img" aria-label="Every task of the year on a timeline, one row per kind of work">
        {/* lane backgrounds + labels */}
        {LANES.map((l, k) => (
          <g key={l.id}>
            <rect x={LABEL} y={TOP + k * ROW} width={W - LABEL} height={ROW} className={k % 2 ? "fill-white" : "fill-stone-50"} />
            <text x={LABEL - 8} y={TOP + k * ROW + ROW / 2 + 4} textAnchor="end" className="fill-stone-600 text-[11px] font-medium">{l.label}</text>
          </g>
        ))}
        {/* month grid */}
        {MONTHS.map((m) => (
          <g key={m.label}>
            <line x1={m.x} x2={m.x} y1={TOP - 4} y2={H - 8} className="stroke-stone-200" />
            <text x={m.x + 3} y={TOP - 7} className="fill-stone-500 text-[10px]">{m.label}</text>
          </g>
        ))}
        <rect x={X_YE[0] - 6} y={TOP} width={X_YE[1] - X_YE[0] + 12} height={H - TOP - 8} className="fill-kowhai-50" />
        <text x={(X_YE[0] + X_YE[1]) / 2} y={TOP - 7} textAnchor="middle" className="fill-kowhai-700 text-[10px] font-semibold">Year end</text>
        <text x={(X_AFTER[0] + X_AFTER[1]) / 2} y={TOP - 7} textAnchor="middle" className="fill-stone-500 text-[10px]">After</text>
        {/* progress line */}
        <line x1={cur.x} x2={cur.x} y1={TOP - 2} y2={H - 8} className="stroke-ink" strokeWidth={1.5} strokeDasharray="3 2" />
        {/* dots */}
        {POINTS.map((p) => {
          const done = p.i < idx, now = p.i === idx;
          return (
            <circle
              key={p.s.id}
              cx={p.x}
              cy={p.y}
              r={now ? 6 : p.big ? 4 : 2.6}
              onClick={() => onJump(p.i)}
              className={cx("cursor-pointer transition-colors", now ? "fill-ink stroke-kowhai-400" : done ? (p.big ? "fill-kowhai-500" : "fill-kowhai-300") : p.big ? "fill-white stroke-stone-400" : "fill-stone-300")}
              strokeWidth={now ? 3 : p.big && !done ? 1.2 : 0}
            >
              <title>{`${nzDate(p.s.date)} · ${p.s.title}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border border-stone-400 bg-white align-middle" />new kind of job</span>
        <span><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-stone-300 align-middle" />routine repeat</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-kowhai-500 align-middle" />done</span>
        <span>Click any dot to jump to that task. Hover for its name.</span>
      </div>
    </div>
  );
}

/* ───────────── Together ───────────── */

export function YearMap({ idx, onJump }: { idx: number; onJump: (i: number) => void }) {
  const step = JOB_STEPS[idx];
  return (
    <details open className="group mb-6 rounded-2xl border border-stone-200 bg-white">
      <summary className="flex cursor-pointer items-center justify-between px-5 py-3">
        <span className="font-bold">🗺️ How it all fits together</span>
        <span className="text-xs text-stone-500 group-open:hidden">show map ▸</span>
        <span className="hidden text-xs text-stone-500 group-open:inline">hide ▾</span>
      </summary>
      <div className="space-y-6 border-t border-stone-100 px-5 pb-5 pt-4">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Where this task sits in the system</div>
          <Flow step={step} />
        </div>
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-500">The whole year: every task, by kind of work</div>
          <Timeline idx={idx} onJump={onJump} />
        </div>
      </div>
    </details>
  );
}
