"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GLOSSARY, GLOSSARY_MAP, type GlossaryEntry } from "@/data/glossary";
import { AID_MAP, MEMORY_AIDS, aidPart, aidsForTerm } from "@/data/memoryAids";
import { DRILLS, DRILL_MAP, maskTerm } from "@/data/study/drills";
import { DRILL_GROUPS, type DrillGroup } from "@/data/study/core";
import { DrillRun, makeSet, type RunItem } from "./DrillRun";
import {
  KNOWN_BOX, MASTERED_SCORE, STORAGE_KEY, dueMissed, isMastered, emptyStudy, exportStudy, parseImport, intervalLabel, isDue, isKnown, loadStudy, markStudied, recordAnswer, schedule, streak, todayLocal,
  type Grade, type StudyData,
} from "@/lib/study/srs";
import { checkRecall, type RecallResult } from "@/lib/study/recall";
import { RichText } from "@/components/learn/RichText";
import { MemoryAid } from "@/components/learn/MemoryAid";
import { cx, pageKey } from "@/lib/ui";

type Level = GlossaryEntry["level"];
type Dir = "forward" | "reverse" | "both";
interface Settings { parts: number[]; levels: Level[]; dir: Dir; newCount: number; aids: boolean; typed: boolean }
const SETTINGS_KEY = "study-settings-v1";
const DEFAULT_SETTINGS: Settings = { parts: [1, 2, 3, 4], levels: ["essential"], dir: "forward", newCount: 10, aids: true, typed: false };

/** settings from an imported file: keep only the known fields with sensible values */
function cleanSettings(raw: Record<string, unknown> | undefined, base: Settings): Settings {
  if (!raw) return base;
  const parts = Array.isArray(raw.parts) ? raw.parts.filter((p): p is number => [1, 2, 3, 4].includes(p as number)) : [];
  const levels = Array.isArray(raw.levels) ? raw.levels.filter((l): l is Level => ["essential", "working", "reference"].includes(l as string)) : [];
  return {
    parts: parts.length ? parts : base.parts,
    levels: levels.length ? levels : base.levels,
    dir: raw.dir === "forward" || raw.dir === "reverse" || raw.dir === "both" ? raw.dir : base.dir,
    newCount: [5, 10, 20, 50].includes(raw.newCount as number) ? (raw.newCount as number) : base.newCount,
    aids: typeof raw.aids === "boolean" ? raw.aids : base.aids,
    typed: typeof raw.typed === "boolean" ? raw.typed : base.typed,
  };
}

const PARTS: Record<number, string> = { 1: "1 · Foundations", 2: "2 · Accounting cycle", 3: "3 · NZ tax & rules", 4: "4 · A year on the job" };
const LEVELS: Record<Level, string> = { essential: "Essential", working: "Working knowledge", reference: "Reference" };
const LEVEL_RANK: Record<Level, number> = { essential: 0, working: 1, reference: 2 };
const ORDER = new Map(GLOSSARY.map((e, i) => [e.key, i]));
/** the order new cards are introduced: by Part, essential first, then as the glossary lists them */
const byCurriculum = (a: GlossaryEntry, b: GlossaryEntry) => a.part - b.part || LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || ORDER.get(a.key)! - ORDER.get(b.key)!;

const cardKey = (id: string) => id.slice(2);
/** how a card is named in lists: the term, or the memory aid's topic */
const cardName = (id: string) => (id.startsWith("a:") ? `🧠 ${AID_MAP[cardKey(id)]?.topic}` : GLOSSARY_MAP[cardKey(id)]?.term) ?? id;

/** a run of drill questions: one drill, or a mixed review */
interface Run {
  title: string;
  icon: string;
  items: RunItem[];
  mixed?: boolean;
  drill?: string;
  learn?: { href: string; label: string };
  again?: { label: string; run: () => RunItem[] | void };
}

const TODAY_NEW = 5;
const MAX_TODAY_MISSED = 10;
/** a toggle button: aria-pressed tells screen readers whether it's on */
const chipProps = (on: boolean) => ({ "aria-pressed": on, className: chip(on) });
const chip = (on: boolean) => cx("rounded-lg px-3 py-1.5 text-sm font-medium transition", on ? "bg-ink text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-100");

export function Study() {
  const [data, setData] = useState<StudyData>(emptyStudy);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [today, setToday] = useState("");
  const [tab, setTab] = useState<"cards" | "drills" | "progress">("cards");
  const [session, setSession] = useState<string[] | null>(null);
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    const saved = (() => { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") } as Settings; } catch { return DEFAULT_SETTINGS; } })();
    // ?part=2 (from a Part's page) studies just that Part; ?tab=drills opens the drills
    const q = new URLSearchParams(window.location.search);
    const part = Number(q.get("part"));
    /* eslint-disable react-hooks/set-state-in-effect -- restore saved progress after hydration */
    setSettings(part >= 1 && part <= 4 ? { ...saved, parts: [part] } : saved);
    if (q.get("tab") === "drills" || q.get("tab") === "progress") setTab(q.get("tab") as "drills" | "progress");
    setData(loadStudy(localStorage.getItem(STORAGE_KEY)));
    setToday(todayLocal());
    // ?drill=key (a lesson's "Practise this" link) starts that drill straight away
    const k = q.get("drill");
    if (k && DRILL_MAP[k]) setRun(drillRun(k));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const update = useCallback((f: (d: StudyData) => StudyData) => {
    setData((prev) => {
      const next = f(prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  const onAnswer = useCallback((it: RunItem, right: boolean) => update((d) => markStudied(recordAnswer(d, it.drill, it.seed, right, todayLocal()), todayLocal())), [update]);
  const changeSettings = (s: Settings) => { setSettings(s); localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); };

  const scope = useMemo(
    () => GLOSSARY.filter((e) => settings.parts.includes(e.part) && settings.levels.includes(e.level)).sort(byCurriculum),
    [settings.parts, settings.levels],
  );
  const ids = useMemo(() => {
    const dirs = settings.dir === "both" ? ["f", "r"] : [settings.dir === "forward" ? "f" : "r"];
    const terms = scope.flatMap((e) => dirs.map((d) => ({ id: `${d}:${e.key}`, part: e.part, rank: LEVEL_RANK[e.level] })));
    // memory aids join each Part's cards after its essential terms
    const aids = settings.aids ? MEMORY_AIDS.filter((a) => settings.parts.includes(aidPart(a))).map((a) => ({ id: `a:${a.key}`, part: aidPart(a), rank: 0.5 })) : [];
    return [...terms, ...aids].sort((a, b) => a.part - b.part || a.rank - b.rank).map((x) => x.id);
  }, [scope, settings.dir, settings.aids, settings.parts]);
  const due = ids.filter((id) => isDue(data.cards[id], today));
  const fresh = ids.filter((id) => !data.cards[id]);
  const known = scope.filter((e) => isKnown(data.cards[`f:${e.key}`])).length;
  const missedDue = today ? dueMissed(data, today).filter((m) => DRILL_MAP[m.drill]) : [];

  /** Today's review: missed questions that are due, then a few new ones from across the course, weakest drills first */
  const todayRun = (): Run => {
    const retry = shuffled(missedDue).slice(0, MAX_TODAY_MISSED).map((m) => ({ drill: m.drill, seed: m.seed }));
    const score = (k: string) => { const st = data.drills[k]; return st ? st.last / st.total : 0.6; };
    const picks = DRILLS.filter((d) => settings.parts.includes(d.part))
      .map((d) => ({ k: d.key, w: score(d.key) + Math.random() * 0.5 }))
      .sort((a, b) => a.w - b.w).slice(0, TODAY_NEW)
      .flatMap((x) => makeSet(x.k, 1));
    const dueCards = shuffled(due);
    return {
      title: "Today's review", icon: "☀️", mixed: true, items: [...retry, ...shuffled(picks)],
      again: dueCards.length ? { label: `Now your ${dueCards.length} due flashcard${dueCards.length === 1 ? "" : "s"} →`, run: () => { setRun(null); setSession(dueCards); } } : undefined,
    };
  };
  const retryRun = (): Run => ({
    title: "Missed questions", icon: "🔁", mixed: true,
    items: shuffled(Object.values(data.missed).filter((m) => DRILL_MAP[m.drill])).slice(0, 20).map((m) => ({ drill: m.drill, seed: m.seed })),
  });

  if (!today) return <div className="h-96 animate-pulse rounded-2xl bg-stone-100" />;

  if (session) {
    return (
      <CardSession
        queue={session}
        data={data}
        today={today}
        typed={settings.typed}
        onGrade={(id, g) => update((d) => markStudied({ ...d, cards: { ...d.cards, [id]: schedule(d.cards[id], g, today) } }, today))}
        onExit={() => setSession(null)}
      />
    );
  }
  if (run) {
    const k = run.drill;
    return (
      <DrillRun
        key={`${run.title}-${run.items[0]?.seed}`}
        {...run}
        onAnswer={onAnswer}
        onFinish={(score, total) => {
          if (!k) return;
          update((d) => {
            const prev = d.drills[k];
            return markStudied({ ...d, drills: { ...d.drills, [k]: { attempts: (prev?.attempts ?? 0) + 1, best: Math.max(prev?.best ?? 0, score), last: score, total, when: today } } }, today);
          });
        }}
        onExit={() => setRun(null)}
      />
    );
  }

  const start = () => setSession([...shuffled(due), ...fresh.slice(0, settings.newCount)]);
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? (xs.length > 1 ? xs.filter((y) => y !== x) : xs) : [...xs, x]);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Due for review" value={due.length} note="cards you've seen before, ready to recall again" />
        <Stat label="New cards" value={fresh.length} note={`not studied yet (${Math.min(settings.newCount, fresh.length)} per session)`} />
        <Stat label="Known" value={`${known} / ${scope.length}`} note="terms you've recalled well over a week or more" />
        <Stat label="Streak" value={`${streak(data.days, today)} day${streak(data.days, today) === 1 ? "" : "s"}`} note="days in a row you've studied" />
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-kowhai-50 p-5 ring-1 ring-kowhai-200 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold">☀️ Today&apos;s review</div>
          <p className="text-sm text-stone-600">
            {missedDue.length > 0 ? <><strong>{Math.min(missedDue.length, MAX_TODAY_MISSED)}</strong> question{missedDue.length === 1 ? "" : "s"} you missed before, then </> : null}
            <strong>{TODAY_NEW}</strong> new questions from across {settings.parts.length === 4 ? "the course" : settings.parts.length === 1 ? `Part ${settings.parts[0]}` : `Parts ${settings.parts.join(", ")}`}, weakest topics first
            {due.length > 0 ? <>, then your <strong>{due.length}</strong> due flashcard{due.length === 1 ? "" : "s"}</> : null}. About ten minutes.
          </p>
        </div>
        <button onClick={() => setRun(todayRun())} className="shrink-0 rounded-xl bg-kowhai-400 px-5 py-3 font-bold text-ink hover:bg-kowhai-300">Start today&apos;s review →</button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {([["cards", "🃏 Flashcards"], ["drills", "🎯 Drills"], ["progress", "📈 Progress"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} className={cx("rounded-lg px-4 py-2 text-sm font-semibold", tab === k ? "bg-ink text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-100")}>{l}</button>
        ))}
      </div>

      {tab === "cards" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5">
            <Field label="Which Parts?" hint="Study the terms from the Parts you've done.">
              {[1, 2, 3, 4].map((p) => <button key={p} {...chipProps(settings.parts.includes(p))} onClick={() => changeSettings({ ...settings, parts: toggle(settings.parts, p) })}>{PARTS[p]}</button>)}
            </Field>
            <Field label="Which levels?" hint="Start with Essential: the terms to know cold.">
              {(Object.keys(LEVELS) as Level[]).map((l) => <button key={l} {...chipProps(settings.levels.includes(l))} onClick={() => changeSettings({ ...settings, levels: toggle(settings.levels, l) })}>{LEVELS[l]}</button>)}
            </Field>
            <Field label="Which way round?" hint="Meaning → term is harder: try it once a term is known.">
              {([["forward", "Term → meaning"], ["reverse", "Meaning → term"], ["both", "Both"]] as const).map(([d, l]) => <button key={d} {...chipProps(settings.dir === d)} onClick={() => changeSettings({ ...settings, dir: d })}>{l}</button>)}
            </Field>
            <Field label="Meaning → term: think it or type it?" hint={settings.dir === "forward" ? "For the Meaning → term cards (pick that above to use it)." : "Typing the term makes you produce it, not just recognise it. It's checked for you; small typos are fine."}>
              {([[false, "Think it"], [true, "Type it"]] as const).map(([v, l]) => <button key={l} {...chipProps(settings.typed === v)} onClick={() => changeSettings({ ...settings, typed: v })}>{l}</button>)}
            </Field>
            <Field label="Memory aids too?" hint="The memory hooks (like DEAD CLIC) as cards of their own.">
              {([[true, "Yes"], [false, "No"]] as const).map(([v, l]) => <button key={l} {...chipProps(settings.aids === v)} onClick={() => changeSettings({ ...settings, aids: v })}>{l}</button>)}
            </Field>
            <Field label="New cards per session">
              {[5, 10, 20, 50].map((n) => <button key={n} {...chipProps(settings.newCount === n)} onClick={() => changeSettings({ ...settings, newCount: n })}>{n}</button>)}
            </Field>
            <button onClick={start} disabled={!due.length && !fresh.length} className="w-full rounded-xl bg-kowhai-400 px-5 py-3 font-bold text-ink hover:bg-kowhai-300 disabled:opacity-50">
              {due.length || fresh.length ? `Start: ${due.length} to review + ${Math.min(settings.newCount, fresh.length)} new →` : "All done for today ✓"}
            </button>
          </div>
          <HowItWorks />
        </div>
      )}

      {tab === "drills" && (
        <div className="space-y-8">
          <p className="max-w-3xl text-stone-600">Questions marked straight away, with the reason for every answer. They&apos;re made from Kōwhai&apos;s own books and the NZ rules the course uses, so there&apos;s always a fresh set.</p>
          <p className="text-sm text-stone-600"><strong className="num">{DRILLS.filter((d) => isMastered(data, d.key)).length} of {DRILLS.length}</strong> drills mastered: your last set scored {Math.round(MASTERED_SCORE * 100)}% or more, with no missed questions left to fix.</p>
          <Link href="/study/year-end" className="block rounded-2xl bg-kowhai-50 p-4 ring-1 ring-kowhai-200 hover:ring-kowhai-500">
            <span className="font-bold">📒 Do the year-end yourself</span>
            <span className="mt-0.5 block text-sm text-stone-600">Start from Kōwhai&apos;s real unadjusted trial balance, post every year-end adjustment, and see your profit beside the real one.</span>
          </Link>
          <Link href="/study/gst-return" className="block rounded-2xl bg-kowhai-50 p-4 ring-1 ring-kowhai-200 hover:ring-kowhai-500">
            <span className="font-bold">🧾 Do the GST return yourself</span>
            <span className="mt-0.5 block text-sm text-stone-600">Sort a real two-monthly period&apos;s transactions into the GST101A, fill in the boxes, and compare your return with the one Kōwhai filed.</span>
          </Link>
          {(Object.keys(DRILL_GROUPS) as DrillGroup[]).map((g) => (
            <section key={g}>
              <h3 className="text-lg font-bold">{DRILL_GROUPS[g].title}</h3>
              <p className="mb-3 text-sm text-stone-500">{DRILL_GROUPS[g].blurb}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {DRILLS.filter((d) => d.group === g).map((d) => {
                  const st = data.drills[d.key];
                  return (
                    <button key={d.key} onClick={() => setRun(drillRun(d.key))} className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 text-left transition hover:border-kowhai-500 hover:shadow-lg">
                      <span className="text-2xl">{d.icon}</span>
                      <span className="mt-2 text-lg font-bold group-hover:underline">{d.title}</span>
                      <span className="mt-1 flex-1 text-sm text-stone-600">{d.blurb}</span>
                      <span className="mt-3 flex items-center justify-between gap-2 text-xs">
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 font-semibold text-stone-500">{PARTS[d.part]}</span>
                        {isMastered(data, d.key)
                          ? <span className="font-semibold text-emerald-700">✓ Mastered</span>
                          : <span className="font-semibold text-kowhai-700">{st ? `Best ${st.best}/${st.total}` : `${d.length ?? 10} questions`}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === "progress" && (
        <Progress
          data={data}
          today={today}
          settings={settings}
          onImport={(d, raw) => { update(() => d); changeSettings(cleanSettings(raw, settings)); }}
          onDrill={(k) => setRun(drillRun(k))}
          onRetry={() => setRun(retryRun())}
          onReset={() => { if (confirm("Reset all study progress? This can't be undone.")) update(() => emptyStudy()); }}
        />
      )}
    </div>
  );
}

function drillRun(k: string): Run {
  const d = DRILL_MAP[k];
  return { title: d.title, icon: d.icon, drill: k, learn: d.learn, items: makeSet(k), again: { label: `New set of ${d.length ?? 10} →`, run: () => makeSet(k) } };
}

function shuffled<T>(xs: T[]) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function Stat({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</div>
      <div className="num mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs text-stone-500">{note}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold">{label}</div>
      {hint && <div className="text-sm text-stone-500">{hint}</div>}
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="rounded-2xl bg-teal-50/70 p-5 text-[15px] leading-relaxed text-stone-700 ring-1 ring-teal-200">
      <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">How it works</div>
      <ol className="mt-2 list-decimal space-y-2 pl-5">
        <li><strong>Recall first.</strong> You see a term and try to remember what it means <em>before</em> you look. Pulling it out of memory is what makes it stick: much more than re-reading.</li>
        <li><strong>Then check, and be honest.</strong> Mark yourself <em>Again</em>, <em>Hard</em>, <em>Good</em> or <em>Easy</em>.</li>
        <li><strong>Spaced repetition.</strong> Cards you know come back less often (1 day, 3 days, a week, two weeks, a month…). Cards you forget come back straight away. A term is <strong>known</strong> once you&apos;ve recalled it well for a week or more.</li>
        <li><strong>A little often.</strong> Ten minutes a day beats an hour once a week. Your progress is saved in this browser.</li>
      </ol>
      <p className="mt-3 text-sm">Keys: <kbd className="rounded bg-white px-1.5 ring-1 ring-stone-300">Space</kbd> to show the answer, <kbd className="rounded bg-white px-1.5 ring-1 ring-stone-300">1</kbd>–<kbd className="rounded bg-white px-1.5 ring-1 ring-stone-300">4</kbd> to mark it. With <em>Type it</em> on, type the term and press <kbd className="rounded bg-white px-1.5 ring-1 ring-stone-300">Enter</kbd>.</p>
    </div>
  );
}

/* ───────────── flashcard session ───────────── */

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: "again", label: "Again", cls: "bg-rose-100 text-rose-800 hover:bg-rose-200" },
  { g: "hard", label: "Hard", cls: "bg-amber-100 text-amber-800 hover:bg-amber-200" },
  { g: "good", label: "Good", cls: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" },
  { g: "easy", label: "Easy", cls: "bg-sky-100 text-sky-800 hover:bg-sky-200" },
];

function CardSession({ queue: start, data, today, typed, onGrade, onExit }: { queue: string[]; data: StudyData; today: string; typed: boolean; onGrade: (id: string, g: Grade) => void; onExit: () => void }) {
  const [queue, setQueue] = useState(start);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [tally, setTally] = useState<Record<Grade, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const id = queue[i];
  const aid = id?.startsWith("a:") ? AID_MAP[cardKey(id)] : undefined;
  const e = id && !aid ? GLOSSARY_MAP[cardKey(id)] : undefined;
  const reverse = id?.startsWith("r:");
  // "Type it": meaning → term cards ask you to type the term, and check it before you mark yourself
  const typing = typed && reverse && !!e;
  const [answer, setAnswer] = useState("");
  const [recall, setRecall] = useState<RecallResult | null>(null);
  const suggested: Grade | null = recall === "wrong" ? "again" : recall ? "good" : null;
  const reveal = (text = answer) => {
    if (typing) setRecall(text.trim() ? checkRecall(e!.term, text) : "wrong");
    setShown(true);
  };
  const front = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  // focus follows the card: its question when it appears, the answer once shown
  useEffect(() => {
    if (!shown && typing) document.getElementById("typed-term")?.focus({ preventScroll: true });
    else (shown ? back : front).current?.focus({ preventScroll: true });
  }, [i, shown, typing]);

  const grade = useCallback((g: Grade) => {
    if (!id || !shown) return;
    onGrade(id, g);
    setTally((t) => ({ ...t, [g]: t[g] + 1 }));
    if (g === "again") setQueue((q) => [...q, id]); // see it again before the session ends
    setShown(false);
    setAnswer("");
    setRecall(null);
    setI((n) => n + 1);
  }, [id, shown, onGrade]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.key === " " || ev.key === "Enter") && !shown && !typing && pageKey(ev, true)) { ev.preventDefault(); setShown(true); }
      const n = Number(ev.key);
      if (shown && n >= 1 && n <= 4 && pageKey(ev)) grade(GRADES[n - 1].g);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, grade, typing]);

  if (!e && !aid) {
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-2 text-2xl font-bold">Session done</h2>
        <p className="mt-2 text-stone-600">{total} answers: {tally.easy} easy, {tally.good} good, {tally.hard} hard, {tally.again} again.</p>
        <p className="mt-1 text-sm text-stone-500">The cards you found hard will come back sooner. Come back tomorrow for your next reviews.</p>
        <button onClick={onExit} className="mt-5 rounded-xl bg-kowhai-400 px-5 py-2.5 font-bold text-ink hover:bg-kowhai-300">Back to study</button>
      </div>
    );
  }

  const prev = data.cards[id];
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between text-sm text-stone-500">
        <button onClick={onExit} className="underline">← End session</button>
        <span>{Math.min(i + 1, queue.length)} / {queue.length}{prev ? "" : " · new card"}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-stone-200"><div className="h-full bg-kowhai-400 transition-all" style={{ width: `${(i / queue.length) * 100}%` }} /></div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-500">{PARTS[aid ? aidPart(aid) : e!.part]}</span>
          <span className={cx("rounded-full px-2 py-0.5", aid ? "bg-teal-100 text-teal-700" : "bg-kowhai-100 text-kowhai-700")}>{aid ? "🧠 Memory aid" : LEVELS[e!.level]}</span>
        </div>
        <div ref={front} tabIndex={-1}>
        {aid ? (
          <>
            <div className="mt-4 text-sm font-semibold uppercase tracking-wider text-stone-500">What does this help you remember, and how?</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{aid.hook}</div>
          </>
        ) : (
          <>
            <div className="mt-4 text-sm font-semibold uppercase tracking-wider text-stone-500">{reverse ? "Which term is this?" : "What does this mean?"}</div>
            {reverse
              ? <div className="mt-2 text-xl leading-snug"><RichText text={maskTerm(e!, e!.short)} inlineOnly /></div>
              : <div className="mt-2 text-3xl font-bold tracking-tight">{e!.term}</div>}
          </>
        )}
        </div>

        {!shown && typing ? (
          <form className="mt-6 flex flex-wrap gap-2" onSubmit={(ev) => { ev.preventDefault(); reveal(); }}>
            <input id="typed-term" value={answer} onChange={(ev) => setAnswer(ev.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false}
              placeholder="Type the term" aria-label="Type the term"
              className="min-w-0 flex-1 basis-56 rounded-xl bg-white px-4 py-3 text-lg ring-2 ring-stone-300 focus:ring-kowhai-500 outline-none" />
            <button type="submit" className="rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">Check <span className="font-normal text-stone-400">(Enter)</span></button>
            <button type="button" onClick={() => reveal("")} className="rounded-xl px-4 py-3 font-semibold text-stone-600 ring-1 ring-stone-300 hover:bg-stone-100">I don&apos;t know</button>
          </form>
        ) : !shown ? (
          <button onClick={() => setShown(true)} className="mt-8 w-full rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">Show answer <span className="font-normal text-stone-400">(Space)</span></button>
        ) : (
          <div ref={back} tabIndex={-1} className="mt-6 border-t border-stone-200 pt-5">
            {recall && (
              <div role="status" className={cx("mb-4 rounded-lg px-4 py-2.5 text-[15px] font-semibold", recall === "wrong" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800")}>
                {recall === "right" ? "✓ Right" : recall === "close" ? <>✓ Close enough: you typed <span className="font-mono">{answer.trim()}</span>. Check the spelling below.</> : answer.trim() ? <>✗ You typed <span className="font-mono">{answer.trim()}</span>.</> : "The answer:"}
              </div>
            )}
            {aid ? <MemoryAid k={aid.key} className="my-0" /> : <CardBack e={e!} reverse={reverse} />}
            <div className="mt-6 text-sm font-semibold text-stone-600">How well did you remember it?{suggested && <span className="font-normal text-stone-500"> Suggested: {suggested === "again" ? "Again, so it comes back soon" : "Good (or Easy if it came instantly)"}.</span>}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map(({ g, label, cls }, n) => (
                <button key={g} onClick={() => grade(g)} className={cx("rounded-xl px-3 py-2.5 text-center font-bold", cls, suggested === g && "ring-2 ring-ink")}>
                  <span className="block">{n + 1} · {label}</span>
                  <span className="block text-xs font-medium opacity-80">{intervalLabel(prev, g)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-stone-500">Due for review on {today} or earlier: {Object.values(data.cards).filter((c) => isDue(c, today)).length} cards in all</p>
    </div>
  );
}

function CardBack({ e, reverse }: { e: GlossaryEntry; reverse?: boolean }) {
  return (
    <>
      {reverse && <div className="text-3xl font-bold tracking-tight">{e.term}</div>}
      <div className={cx("rounded-lg bg-kowhai-50 px-4 py-3 text-lg leading-snug", reverse && "mt-3")}><RichText text={e.short} inlineOnly /></div>
      {e.example && <div className="mt-3 text-[15px] text-stone-700"><span className="font-semibold text-stone-500">☕ At Kōwhai: </span><RichText text={e.example} inlineOnly /></div>}
      {e.mistake && <div className="mt-2 text-[15px] text-stone-700"><span className="font-semibold text-rose-700">⚠ Common mistake: </span><RichText text={e.mistake} inlineOnly /></div>}
      {aidsForTerm(e.key).slice(0, 1).map((a) => <MemoryAid key={a.key} k={a.key} compact link={false} />)}
      <details className="mt-3 text-[15px]">
        <summary className="cursor-pointer text-sm font-semibold text-stone-600 hover:underline">Full explanation</summary>
        <div className="prose-learn mt-2"><RichText text={e.body} /></div>
        {e.href && <Link href={e.href} className="mt-2 inline-block text-sm font-semibold text-kowhai-700 underline">Learn it in full →</Link>}
      </details>
    </>
  );
}

/* ───────────── progress ───────────── */

interface ProgressProps {
  data: StudyData;
  today: string;
  settings: Settings;
  onImport: (d: StudyData, settings?: Record<string, unknown>) => void;
  onDrill: (k: string) => void;
  onRetry: () => void;
  onReset: () => void;
}

function Progress({ data, today, settings, onImport, onDrill, onRetry, onReset }: ProgressProps) {
  const missed = Object.values(data.missed).filter((m) => DRILL_MAP[m.drill]);
  const missedBy = missed.reduce<Record<string, number>>((acc, m) => ({ ...acc, [m.drill]: (acc[m.drill] ?? 0) + 1 }), {});
  // weakest drills: the lowest last score, then the most questions still to fix
  const weakDrills = DRILLS.filter((d) => data.drills[d.key] || missedBy[d.key])
    .map((d) => { const st = data.drills[d.key]; return { d, pct: st ? st.last / st.total : 1, open: missedBy[d.key] ?? 0 }; })
    .filter((x) => x.pct < MASTERED_SCORE || x.open > 0)
    .sort((a, b) => a.pct - b.pct || b.open - a.open)
    .slice(0, 6);
  // weakest cards: forgotten most often, then still in the lowest box
  const weakCards = Object.entries(data.cards)
    .filter(([id, c]) => (c.lapses > 0 || (c.reps > 1 && c.box <= 1)) && (id.startsWith("a:") ? AID_MAP[cardKey(id)] : GLOSSARY_MAP[cardKey(id)]))
    .sort(([, a], [, b]) => b.lapses - a.lapses || a.box - b.box)
    .slice(0, 10);
  const aidsKnown = MEMORY_AIDS.filter((a) => isKnown(data.cards[`a:${a.key}`])).length;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-bold">Your weakest topics</h3>
        <p className="text-sm text-stone-500">Where to spend the next ten minutes.</p>
        {!weakDrills.length && !weakCards.length ? (
          <p className="mt-3 text-[15px] text-stone-600">Nothing yet. Try a few drills and flashcards, and the ones that trip you up will show here.</p>
        ) : (
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-stone-600">Drills</div>
              {weakDrills.length ? (
                <ul className="mt-2 space-y-2">
                  {weakDrills.map(({ d, pct, open }) => (
                    <li key={d.key} className="flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1">{d.icon} {d.title}<span className="block text-xs text-stone-500">{data.drills[d.key] ? `Last score ${Math.round(pct * 100)}%` : "Not finished yet"}{open ? ` · ${open} missed question${open === 1 ? "" : "s"} to fix` : ""}</span></span>
                      <button onClick={() => onDrill(d.key)} className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-stone-300 hover:bg-stone-100">Practise</button>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-stone-500">All your drill scores are 80% or more.</p>}
            </div>
            <div>
              <div className="text-sm font-semibold text-stone-600">Cards you keep forgetting</div>
              {weakCards.length ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {weakCards.map(([id, c]) => (
                    <li key={id} className="rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-900 ring-1 ring-rose-200">{cardName(id)}{id.startsWith("r:") ? " (meaning → term)" : ""}{c.lapses ? <span className="text-rose-600"> · forgot {c.lapses}×</span> : null}</li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-stone-500">None so far.</p>}
            </div>
          </div>
        )}
        {missed.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4 text-sm">
            <span className="flex-1 text-stone-600"><strong>{missed.length}</strong> missed question{missed.length === 1 ? "" : "s"} saved, {missed.filter((m) => m.state.due <= today).length} due today. Each one comes back until you get it right twice.</span>
            <button onClick={onRetry} className="rounded-lg bg-kowhai-400 px-3 py-1.5 font-bold text-ink hover:bg-kowhai-300">Retry them now</button>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-bold">Terms by Part</h3>
        <p className="text-sm text-stone-500"><span className="font-semibold text-emerald-700">Known</span>: recalled well for a week or more · <span className="font-semibold text-kowhai-700">Learning</span>: seen, not yet known · <span className="font-semibold text-stone-500">New</span>: not studied yet (term → meaning cards)</p>
        <div className="mt-4 space-y-4">
          {[1, 2, 3, 4].map((p) => (
            <div key={p}>
              <div className="mb-1 text-sm font-semibold">{PARTS[p]}</div>
              {(["essential", "working"] as Level[]).map((l) => {
                const terms = GLOSSARY.filter((e) => e.part === p && e.level === l);
                if (!terms.length) return null;
                const states = terms.map((e) => data.cards[`f:${e.key}`]);
                const kn = states.filter((c) => c && c.box >= KNOWN_BOX).length;
                const learning = states.filter((c) => c && c.box < KNOWN_BOX).length;
                return (
                  <div key={l} className="mb-1.5 grid grid-cols-[8.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
                    <span className="text-stone-600">{LEVELS[l]}</span>
                    <span className="flex h-3 overflow-hidden rounded-full bg-stone-200">
                      <span className="bg-emerald-500" style={{ width: `${(kn / terms.length) * 100}%` }} />
                      <span className="bg-kowhai-400" style={{ width: `${(learning / terms.length) * 100}%` }} />
                    </span>
                    <span className="num text-right text-stone-600">{kn}/{terms.length}</span>
                  </div>
                );
              })}
              <Link href={`/study?part=${p}`} className="text-xs font-semibold text-kowhai-700 underline">Study Part {p} only</Link>
            </div>
          ))}
          <div className="grid grid-cols-[8.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 border-t border-stone-100 pt-3 text-sm">
            <span className="text-stone-600">🧠 Memory aids</span>
            <span className="flex h-3 overflow-hidden rounded-full bg-stone-200"><span className="bg-emerald-500" style={{ width: `${(aidsKnown / MEMORY_AIDS.length) * 100}%` }} /></span>
            <span className="num text-right text-stone-600">{aidsKnown}/{MEMORY_AIDS.length}</span>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-bold">Drills</h3>
        <p className="text-sm text-stone-500"><strong className="num text-emerald-700">{DRILLS.filter((d) => isMastered(data, d.key)).length} of {DRILLS.length} mastered</strong>: last set {Math.round(MASTERED_SCORE * 100)}% or more and no missed questions left. Drills don&apos;t change the flashcard <em>Known</em> count, which is about recalling terms over time.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead><tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500"><th className="py-1">Drill</th><th className="py-1 text-right">Tries</th><th className="py-1 text-right">Best</th><th className="py-1 text-right">Last</th></tr></thead>
            <tbody>
              {DRILLS.map((d) => {
                const st = data.drills[d.key];
                return (
                  <tr key={d.key} className="border-b border-stone-100">
                    <td className="py-1.5">{d.icon} {d.title}{isMastered(data, d.key) && <span className="ml-1.5 text-xs font-semibold text-emerald-700">✓ Mastered</span>}</td>
                    <td className="num py-1.5 text-right">{st?.attempts ?? 0}</td>
                    <td className="num py-1.5 text-right">{st ? `${st.best}/${st.total}` : "–"}</td>
                    <td className="num py-1.5 text-right">{st ? `${st.last}/${st.total}` : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <SaveProgress data={data} today={today} settings={settings} onImport={onImport} onReset={onReset} />
    </div>
  );
}

/* ───────────── export / import ───────────── */

function SaveProgress({ data, today, settings, onImport, onReset }: { data: StudyData; today: string; settings: Settings; onImport: ProgressProps["onImport"]; onReset: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const n = (x: object, one: string, many: string) => { const k = Object.keys(x).length; return `${k} ${k === 1 ? one : many}`; };
  const counts = (d: StudyData) => `${n(d.cards, "card", "cards")}, ${n(d.drills, "drill score", "drill scores")}, ${n(d.missed, "missed question", "missed questions")}`;

  const download = () => {
    const blob = new Blob([exportStudy(data, settings)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kowhai-study-progress-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: `Saved ${counts(data)} to kowhai-study-progress-${today}.json.` });
  };

  const load = async (f: File | undefined) => {
    if (!f) return;
    const res = parseImport(await f.text());
    if (file.current) file.current.value = "";
    if ("error" in res) { setMsg({ ok: false, text: res.error }); return; }
    if (!confirm(`Replace the progress in this browser with the file's (${counts(res.study)})? Your current progress will be lost unless you've exported it.`)) return;
    onImport(res.study, res.settings);
    setMsg({ ok: true, text: `Imported ${counts(res.study)}.` });
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="font-bold">Keep your progress</h3>
      <p className="mt-1 text-sm text-stone-500">Progress is saved in this browser only, and clearing your browser data clears it. Export it to a file to keep a copy or carry it to another device or browser, then import it there.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <button onClick={download} className="rounded-lg bg-ink px-3 py-1.5 font-semibold text-white hover:bg-ink/85">⬇ Export progress</button>
        <button onClick={() => file.current?.click()} className="rounded-lg px-3 py-1.5 font-semibold ring-1 ring-stone-300 hover:bg-stone-100">⬆ Import progress…</button>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => load(e.target.files?.[0])} aria-label="Progress file to import" />
        <button onClick={onReset} className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-50 sm:ml-auto">Reset progress</button>
      </div>
      {msg && <p role="status" className={cx("mt-3 text-sm font-medium", msg.ok ? "text-emerald-700" : "text-rose-700")}>{msg.ok ? "✓ " : "✗ "}{msg.text}</p>}
    </div>
  );
}
