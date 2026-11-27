/**
 * Spaced repetition for the study tool: a simple Leitner-box scheduler.
 *
 * Each card sits in a box. Answering it well moves it up a box, and each box waits
 * longer before the card comes back: 0 (again this session), 1, 3, 7, 14, 30, then 60 days.
 * Forgetting it sends it back to box 0. Easy to explain, and it's what flashcard
 * systems are built on.
 */

export type Grade = "again" | "hard" | "good" | "easy";

export interface CardState {
  box: number;
  /** ISO date (yyyy-mm-dd) the card is next due */
  due: string;
  reps: number;
  lapses: number;
}

/** days to wait before a card in each box comes back */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30, 60];
export const MAX_BOX = BOX_DAYS.length - 1;
/** a card counts as "known" once it has reached this box (a week or more between reviews) */
export const KNOWN_BOX = 3;

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** today's date in the learner's own time zone, as yyyy-mm-dd */
export function todayLocal(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function nextBox(box: number, grade: Grade) {
  if (grade === "again") return 0;
  if (grade === "hard") return Math.max(1, box);
  if (grade === "good") return Math.min(MAX_BOX, box + 1);
  return Math.min(MAX_BOX, box + 2);
}

export function schedule(prev: CardState | undefined, grade: Grade, today: string): CardState {
  const box = nextBox(prev?.box ?? 0, grade);
  return {
    box,
    due: addDays(today, BOX_DAYS[box]),
    reps: (prev?.reps ?? 0) + 1,
    lapses: (prev?.lapses ?? 0) + (grade === "again" && prev && prev.box > 0 ? 1 : 0),
  };
}

/** how long until the card comes back, for the grade buttons */
export function intervalLabel(prev: CardState | undefined, grade: Grade) {
  const d = BOX_DAYS[nextBox(prev?.box ?? 0, grade)];
  if (d === 0) return "again now";
  if (d === 1) return "1 day";
  if (d < 30) return `${d} days`;
  return d === 30 ? "1 month" : "2 months";
}

export const isDue = (c: CardState | undefined, today: string) => !!c && c.due <= today;
export const isKnown = (c: CardState | undefined) => !!c && c.box >= KNOWN_BOX;

/** a drill is mastered when its last full set scored this much or more */
export const MASTERED_SCORE = 0.8;

/**
 * Drills count separately from flashcards: "known" stays a flashcard idea (recalled well a week apart).
 * A drill is mastered when the last set scored 80% or more and none of its missed questions are still open.
 */
export function isMastered(d: Pick<StudyData, "drills" | "missed">, drill: string) {
  const st = d.drills[drill];
  if (!st || !st.total || st.last / st.total < MASTERED_SCORE) return false;
  return !Object.values(d.missed).some((m) => m.drill === drill);
}

/* ───────────── saved progress ───────────── */

export interface DrillStat { attempts: number; best: number; last: number; total: number; when: string }

/** a drill question the learner got wrong: its seed regenerates exactly the same question */
export interface MissedQ { drill: string; seed: number; state: CardState }

export interface StudyData {
  version: 1;
  cards: Record<string, CardState>;
  drills: Record<string, DrillStat>;
  /** missed drill questions, keyed "drill:seed", brought back by the same scheduler as the cards */
  missed: Record<string, MissedQ>;
  /** days (yyyy-mm-dd) the learner studied, for the streak */
  days: string[];
}

export const STORAGE_KEY = "study-v1";
export const emptyStudy = (): StudyData => ({ version: 1, cards: {}, drills: {}, missed: {}, days: [] });

export function loadStudy(raw: string | null): StudyData {
  if (!raw) return emptyStudy();
  try {
    const d = JSON.parse(raw) as StudyData;
    return d && d.version === 1 ? { ...emptyStudy(), ...d } : emptyStudy();
  } catch {
    return emptyStudy();
  }
}

export function markStudied(d: StudyData, today: string): StudyData {
  return d.days.includes(today) ? d : { ...d, days: [...d.days, today].slice(-400) };
}

/** consecutive days studied, ending today (or yesterday, if not yet today) */
export function streak(days: string[], today: string) {
  const set = new Set(days);
  let day = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(day)) { n++; day = addDays(day, -1); }
  return n;
}

/* ───────────── missed drill questions ───────────── */

export const MAX_MISSED = 200;
export const missedKey = (drill: string, seed: number) => `${drill}:${seed}`;

/**
 * Record one drill answer.
 * - Wrong: the question is saved (or kept) and comes back tomorrow.
 * - Right on a saved question: it moves up a box; once it reaches "known"
 *   (right twice, a day and then three days after the miss) it's dropped.
 * - Right on a new question: nothing to save.
 */
export function recordAnswer(d: StudyData, drill: string, seed: number, right: boolean, today: string): StudyData {
  const k = missedKey(drill, seed);
  const prev = d.missed[k];
  if (right && !prev) return d;
  const missed = { ...d.missed };
  if (right) {
    const state = schedule(prev.state, "good", today);
    if (state.box >= KNOWN_BOX) delete missed[k];
    else missed[k] = { ...prev, state };
  } else {
    delete missed[k]; // re-insert so it counts as the newest
    missed[k] = { drill, seed, state: { box: 1, due: addDays(today, 1), reps: (prev?.state.reps ?? 0) + 1, lapses: (prev?.state.lapses ?? 0) + 1 } };
    const keys = Object.keys(missed);
    for (const old of keys.slice(0, Math.max(0, keys.length - MAX_MISSED))) delete missed[old];
  }
  return { ...d, missed };
}

export const dueMissed = (d: StudyData, today: string) => Object.values(d.missed).filter((m) => m.state.due <= today);

/* ───────────── export / import (progress lives in one browser) ───────────── */

export const EXPORT_APP = "kowhai-cafe-study";

export interface StudyExport {
  app: typeof EXPORT_APP;
  exported: string;
  study: StudyData;
  settings?: Record<string, unknown>;
}

export function exportStudy(study: StudyData, settings: object, now = new Date()): string {
  const out: StudyExport = { app: EXPORT_APP, exported: now.toISOString(), study, settings: { ...settings } };
  return JSON.stringify(out, null, 2);
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const isDate = (x: unknown) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x);
const isCard = (c: unknown) => isObj(c) && Number.isInteger(c.box) && (c.box as number) >= 0 && (c.box as number) <= MAX_BOX && isDate(c.due) && typeof c.reps === "number" && typeof c.lapses === "number";

/**
 * Read an exported file. Returns null (with the reason) if it isn't a study export,
 * so a wrong or damaged file never replaces real progress.
 * Unknown or broken entries inside a good file are dropped rather than failing the whole import.
 */
export function parseImport(text: string): { study: StudyData; settings?: Record<string, unknown> } | { error: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { error: "That file isn't a progress export (it's not JSON)." }; }
  if (!isObj(raw) || raw.app !== EXPORT_APP || !isObj(raw.study)) return { error: "That file isn't a Kōwhai Café study export." };
  const s = raw.study;
  if (s.version !== 1) return { error: "That export is from a different version of the study tool." };
  const cards = Object.fromEntries(Object.entries(isObj(s.cards) ? s.cards : {}).filter(([k, c]) => /^[fra]:/.test(k) && isCard(c))) as Record<string, CardState>;
  const drills = Object.fromEntries(Object.entries(isObj(s.drills) ? s.drills : {}).filter(([, d]) =>
    isObj(d) && [d.attempts, d.best, d.last, d.total].every((n) => typeof n === "number") && isDate(d.when))) as Record<string, DrillStat>;
  const missed = Object.fromEntries(Object.entries(isObj(s.missed) ? s.missed : {}).filter(([k, m]) =>
    isObj(m) && typeof m.drill === "string" && Number.isInteger(m.seed) && k === missedKey(m.drill, m.seed as number) && isCard(m.state))) as Record<string, MissedQ>;
  const days = (Array.isArray(s.days) ? s.days : []).filter(isDate).slice(-400) as string[];
  return { study: { version: 1, cards, drills, missed, days }, settings: isObj(raw.settings) ? raw.settings : undefined };
}
