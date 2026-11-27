"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CYCLE_STEPS } from "@/data/cycle";
import { cx } from "@/lib/ui";

/** round so server and browser produce identical strings (avoids hydration mismatch) */
const rd = (n: number) => Math.round(n * 100) / 100;

export function useVisited() {
  const [visited, setVisited] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage after hydration
    setVisited(JSON.parse(localStorage.getItem("cycle-visited") ?? "[]"));
  }, []);
  return visited;
}

export function MarkVisited({ slug }: { slug: string }) {
  useEffect(() => {
    const v: string[] = JSON.parse(localStorage.getItem("cycle-visited") ?? "[]");
    if (!v.includes(slug)) localStorage.setItem("cycle-visited", JSON.stringify([...v, slug]));
  }, [slug]);
  return null;
}

/** The accounting cycle as a clickable wheel */
export function CycleWheel({ current, size = 520 }: { current?: string; size?: number }) {
  const visited = useVisited();
  const n = CYCLE_STEPS.length;
  const r = size / 2 - 58;
  // shrink the whole wheel (boxes, text and all) to fit narrow screens
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / size)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);
  return (
    <div ref={outer} className="mx-auto w-full" style={{ maxWidth: size, height: size * scale }}>
    <div className="relative origin-top-left" style={{ width: size, height: size, transform: scale < 1 ? `scale(${scale})` : undefined }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#b44d12" />
          </marker>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fce588" strokeWidth={18} />
        {CYCLE_STEPS.map((_, i) => {
          const a1 = (i / n) * 2 * Math.PI - Math.PI / 2 + 0.2;
          const a2 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2 - 0.2;
          const x1 = rd(size / 2 + r * Math.cos(a1)), y1 = rd(size / 2 + r * Math.sin(a1));
          const x2 = rd(size / 2 + r * Math.cos(a2)), y2 = rd(size / 2 + r * Math.sin(a2));
          return <path key={i} d={`M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`} fill="none" stroke="#de911d" strokeWidth={2.5} markerEnd="url(#arr)" />;
        })}
      </svg>
      <div className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-kowhai-700">The accounting cycle</div>
        <div className="mt-1 text-sm text-stone-600">Steps 1–4 happen every day. Steps 5–11 happen at balance date (31 March).</div>
      </div>
      {CYCLE_STEPS.map((s, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        const left = `${rd(50 + ((r / size) * 100) * Math.cos(a))}%`;
        const top = `${rd(50 + ((r / size) * 100) * Math.sin(a))}%`;
        const isCur = s.slug === current;
        const done = visited.includes(s.slug);
        return (
          <Link
            key={s.slug}
            href={`/cycle/${s.slug}`}
            style={{ left, top }}
            className={cx(
              "absolute flex w-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border-2 px-1 py-1.5 text-center shadow-sm transition hover:scale-105",
              isCur ? "border-ink bg-ink text-white" : s.when === "during" ? "border-sky-300 bg-sky-50" : "border-kowhai-500 bg-white",
            )}
            title={s.blurb}
            aria-label={`Step ${s.n}: ${s.short}${isCur ? " (this step)" : done ? " (visited)" : ""}`}
            aria-current={isCur ? "page" : undefined}
          >
            <span className={cx("text-xs font-black", isCur ? "text-kowhai-300" : "text-kowhai-700")}>{s.n}{done && !isCur ? " ✓" : ""}</span>
            <span className="text-[11px] font-semibold leading-tight">{s.short}</span>
          </Link>
        );
      })}
    </div>
    </div>
  );
}
