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

/* ───────────── saved progress ───────────── */

export interface DrillStat { attempts: number; best: number; last: number; total: number; when: string }

export interface StudyData {
  version: 1;
  cards: Record<string, CardState>;
  drills: Record<string, DrillStat>;
  /** days (yyyy-mm-dd) the learner studied, for the streak */
  days: string[];
}

export const STORAGE_KEY = "study-v1";
export const emptyStudy = (): StudyData => ({ version: 1, cards: {}, drills: {}, days: [] });

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
