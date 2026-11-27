"use client";

import type { ReactNode } from "react";
import { GLOSSARY_MAP } from "@/data/glossary";
import { useOverlay } from "./Overlay";

/** A glossary term: hover for a one-line definition, click for the full explainer overlay */
export function Term({ k, children }: { k: string; children?: ReactNode }) {
  const { openTerm } = useOverlay();
  const e = GLOSSARY_MAP[k];
  const label = children ?? e?.term.replace(/\s*\(.*\)$/, "").toLowerCase() ?? k;
  return (
    <span className="group relative inline">
      <button
        type="button"
        onClick={(ev) => {
          ev.stopPropagation();
          openTerm(k);
        }}
        className="cursor-help border-b-2 border-dotted border-kowhai-500 font-medium text-inherit hover:bg-kowhai-100"
      >
        {label}
      </button>
      {e && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-72 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-left text-sm font-normal leading-snug text-white shadow-lg group-hover:block group-focus-within:block"
        >
          <span className="block font-semibold text-kowhai-300">{e.term}</span>
          {e.short.replaceAll("**", "")}
          <span className="mt-1 block text-xs text-stone-300">Click for the full explanation</span>
        </span>
      )}
    </span>
  );
}
