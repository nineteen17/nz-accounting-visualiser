import type { AccountType } from "@/lib/engine/types";

/** One colour per element of the accounting equation, used everywhere */
export const TYPE_STYLE: Record<AccountType, { bg: string; soft: string; text: string; border: string; bar: string; label: string }> = {
  asset: { bg: "bg-sky-600", soft: "bg-sky-50", text: "text-sky-800", border: "border-sky-300", bar: "#0284c7", label: "Asset" },
  liability: { bg: "bg-rose-600", soft: "bg-rose-50", text: "text-rose-800", border: "border-rose-300", bar: "#e11d48", label: "Liability" },
  equity: { bg: "bg-violet-600", soft: "bg-violet-50", text: "text-violet-800", border: "border-violet-300", bar: "#7c3aed", label: "Equity" },
  income: { bg: "bg-emerald-600", soft: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300", bar: "#059669", label: "Income" },
  expense: { bg: "bg-amber-600", soft: "bg-amber-50", text: "text-amber-800", border: "border-amber-300", bar: "#d97706", label: "Expense" },
};

/**
 * Is this key press meant for the page's own shortcuts? Not when typing in a field, not inside an open
 * explainer, and not with Ctrl/Alt/Cmd (browser shortcuts such as Alt+← for Back).
 * `activates`: for Enter and Space, which already press a focused button or link.
 */
export function pageKey(ev: KeyboardEvent, activates = false) {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return false;
  const t = ev.target instanceof Element ? ev.target : null;
  if (t?.closest("input, textarea, select, [contenteditable], [role=dialog]")) return false;
  if (activates && t?.closest("button, a, summary")) return false;
  return true;
}

export const cx = (...xs: (string | number | false | null | undefined)[]) => xs.filter(Boolean).join(" ");
