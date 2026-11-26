"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GLOSSARY_MAP } from "@/data/glossary";
import { RichText } from "./RichText";
import { MemoryAid } from "./MemoryAid";
import { aidsForTerm } from "@/data/memoryAids";

type Panel = { kind: "term"; key: string } | { kind: "custom"; title: string; content: ReactNode };

interface Ctx {
  openTerm: (key: string) => void;
  openCustom: (title: string, content: ReactNode) => void;
}
const OverlayCtx = createContext<Ctx>({ openTerm: () => {}, openCustom: () => {} });
export const useOverlay = () => useContext(OverlayCtx);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Panel[]>([]);
  const openTerm = useCallback((key: string) => setStack((s) => [...s, { kind: "term", key }]), []);
  const openCustom = useCallback((title: string, content: ReactNode) => setStack((s) => [...s, { kind: "custom", title, content }]), []);
  const close = () => setStack([]);
  const back = () => setStack((s) => s.slice(0, -1));
  const top = stack[stack.length - 1];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setStack([]);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <OverlayCtx.Provider value={{ openTerm, openCustom }}>
      {children}
      <AnimatePresence>
        {top && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center gap-2 border-b border-stone-200 bg-kowhai-50 px-5 py-3">
                {stack.length > 1 && (
                  <button onClick={back} className="rounded px-2 py-1 text-sm text-stone-600 hover:bg-kowhai-100">
                    ← Back
                  </button>
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-kowhai-700">
                  {top.kind === "term" ? "Explainer" : "More detail"}
                </span>
                <button onClick={close} className="ml-auto rounded px-2 py-1 text-xl leading-none text-stone-500 hover:bg-kowhai-100" aria-label="Close">
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {top.kind === "term" ? <TermPanel k={top.key} onNavigate={close} /> : (
                  <>
                    <h2 className="mb-3 text-2xl font-bold">{top.title}</h2>
                    <div className="prose-learn">{top.content}</div>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </OverlayCtx.Provider>
  );
}

function TermPanel({ k, onNavigate }: { k: string; onNavigate: () => void }) {
  const { openTerm } = useOverlay();
  const e = GLOSSARY_MAP[k];
  if (!e) return <p>Unknown term: {k}</p>;
  return (
    <div>
      <h2 className="text-2xl font-bold">{e.term}</h2>
      <p className="mt-2 rounded-lg bg-kowhai-50 px-4 py-3 text-lg leading-snug"><RichText text={e.short} inlineOnly /></p>
      {e.nz && GLOSSARY_MAP[e.nz] && (
        <button onClick={() => openTerm(e.nz!)} className="mt-3 inline-flex items-center gap-2 rounded-lg border-2 border-kowhai-400 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-kowhai-50">
          🇳🇿 NZ term: {GLOSSARY_MAP[e.nz].term} →
        </button>
      )}
      <div className="prose-learn mt-4">
        <RichText text={e.body} />
      </div>
      {e.example && (
        <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-700">☕ At Kōwhai Café</div>
          <div className="prose-learn text-sm"><RichText text={e.example} /></div>
        </div>
      )}
      {e.mistake && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-700">⚠ Common mistake</div>
          <div className="text-sm leading-relaxed"><RichText text={e.mistake} /></div>
        </div>
      )}
      {aidsForTerm(k).map((a) => <MemoryAid key={a.key} k={a.key} compact link={false} className="mt-3" />)}
      {e.href && (
        <Link href={e.href} onClick={onNavigate} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/85">
          {e.category === "us" ? "All US vs NZ differences →" : "Go deeper: full page →"}
        </Link>
      )}
    </div>
  );
}

/** A button that opens arbitrary explanatory content in the side overlay */
export function Explain({ title, label = "Explain this", children, className }: { title: string; label?: string; children: ReactNode; className?: string }) {
  const { openCustom } = useOverlay();
  return (
    <button
      onClick={() => openCustom(title, children)}
      className={className ?? "inline-flex items-center gap-1 rounded-full border border-kowhai-400 bg-kowhai-50 px-3 py-1 text-sm font-medium text-kowhai-700 hover:bg-kowhai-100"}
    >
      <span aria-hidden>ⓘ</span> {label}
    </button>
  );
}
