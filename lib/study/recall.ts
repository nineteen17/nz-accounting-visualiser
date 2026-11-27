/**
 * Typed recall for "meaning → term" flashcards: is what the learner typed the term?
 * Forgiving on capitals, punctuation, "&"/"and" and a small typo, so it's checking
 * that you know the term, not your spelling.
 */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // ō → o
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9%$ ]+/g, " ")
    .replace(/^\s*(the|a|an)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

/** every way of writing the term that counts: "PAYE (Pay As You Earn)" → full, "PAYE", "Pay As You Earn" */
export function acceptedAnswers(term: string): string[] {
  const out = new Set<string>([term]);
  const base = term.replace(/\s*\([^)]*\)/g, "").trim();
  out.add(base);
  for (const [, inner] of term.matchAll(/\(([^)]+)\)/g)) {
    for (const part of inner.split(/,|\bor\b|;/)) {
      const p = part.replace(/^(incl\.?|e\.g\.?)\s*/i, "").trim();
      if (p.length >= 2 && !/^us$/i.test(p)) out.add(p);
    }
  }
  // "W-4 / W-2" or "Stockholders / common stock": either half
  for (const half of base.split(/\s+\/\s+/)) if (half !== base) out.add(half);
  return [...out].map(norm).filter((x) => x.length >= 2);
}

/** Levenshtein distance, stopping early once it's past `max` */
function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, row[j]);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

export type RecallResult = "right" | "close" | "wrong";

/** right: matches one of the accepted answers; close: one small slip (a typo per 6 letters); wrong: anything else */
export function checkRecall(term: string, typed: string): RecallResult {
  const t = norm(typed);
  if (!t) return "wrong";
  const answers = acceptedAnswers(term);
  if (answers.includes(t)) return "right";
  // short answers (abbreviations like GST or IR4) have to be exact
  if (answers.some((a) => a.length >= 5 && distance(a, t, Math.floor(a.length / 6)) <= Math.floor(a.length / 6))) return "close";
  return "wrong";
}
