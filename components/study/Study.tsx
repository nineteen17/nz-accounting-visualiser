"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GLOSSARY, GLOSSARY_MAP, type GlossaryEntry } from "@/data/glossary";
import { aidsForTerm } from "@/data/memoryAids";
import { DRILLS, maskTerm, type DrillKey } from "@/data/study/drills";
import { DRILL_GROUPS, type DrillGroup } from "@/data/study/core";
import { DrillRun } from "./DrillRun";
import {
  KNOWN_BOX, STORAGE_KEY, emptyStudy, intervalLabel, isDue, isKnown, loadStudy, markStudied, schedule, streak, todayLocal,
  type Grade, type StudyData,
} from "@/lib/study/srs";
import { RichText } from "@/components/learn/RichText";
import { MemoryAid } from "@/components/learn/MemoryAid";
import { cx } from "@/lib/ui";

type Level = GlossaryEntry["level"];
type Dir = "forward" | "reverse" | "both";
interface Settings { parts: number[]; levels: Level[]; dir: Dir; newCount: number }
const SETTINGS_KEY = "study-settings-v1";
const DEFAULT_SETTINGS: Settings = { parts: [1, 2, 3, 4], levels: ["essential"], dir: "forward", newCount: 10 };

const PARTS: Record<number, string> = { 1: "1 · Foundations", 2: "2 · Accounting cycle", 3: "3 · NZ tax & rules", 4: "4 · A year on the job" };
const LEVELS: Record<Level, string> = { essential: "Essential", working: "Working knowledge", reference: "Reference" };
const LEVEL_RANK: Record<Level, number> = { essential: 0, working: 1, reference: 2 };
const ORDER = new Map(GLOSSARY.map((e, i) => [e.key, i]));
/** the order new cards are introduced: by Part, essential first, then as the glossary lists them */
const byCurriculum = (a: GlossaryEntry, b: GlossaryEntry) => a.part - b.part || LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || ORDER.get(a.key)! - ORDER.get(b.key)!;

const cardKey = (id: string) => id.slice(2);
const chip = (on: boolean) => cx("rounded-lg px-3 py-1.5 text-sm font-medium transition", on ? "bg-ink text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-100");

export function Study() {
  const [data, setData] = useState<StudyData>(emptyStudy);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [today, setToday] = useState("");
  const [tab, setTab] = useState<"cards" | "drills" | "progress">("cards");
  const [session, setSession] = useState<string[] | null>(null);
  const [drill, setDrill] = useState<DrillKey | null>(null);

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
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const save = useCallback((d: StudyData) => { setData(d); localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }, []);
  const changeSettings = (s: Settings) => { setSettings(s); localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); };

  const scope = useMemo(
    () => GLOSSARY.filter((e) => settings.parts.includes(e.part) && settings.levels.includes(e.level)).sort(byCurriculum),
    [settings.parts, settings.levels],
  );
  const ids = useMemo(() => {
    const dirs = settings.dir === "both" ? ["f", "r"] : [settings.dir === "forward" ? "f" : "r"];
    return scope.flatMap((e) => dirs.map((d) => `${d}:${e.key}`));
  }, [scope, settings.dir]);
  const due = ids.filter((id) => isDue(data.cards[id], today));
  const fresh = ids.filter((id) => !data.cards[id]);
  const known = scope.filter((e) => isKnown(data.cards[`f:${e.key}`])).length;

  if (!today) return <div className="h-96 animate-pulse rounded-2xl bg-stone-100" />;

  if (session) {
    return (
      <CardSession
        queue={session}
        data={data}
        today={today}
        onGrade={(id, g) => save(markStudied({ ...data, cards: { ...data.cards, [id]: schedule(data.cards[id], g, today) } }, today))}
        onExit={() => setSession(null)}
      />
    );
  }
  if (drill) {
    return (
      <DrillRun
        k={drill}
        onFinish={(score, total) => {
          const prev = data.drills[drill];
          save(markStudied({ ...data, drills: { ...data.drills, [drill]: { attempts: (prev?.attempts ?? 0) + 1, best: Math.max(prev?.best ?? 0, score), last: score, total, when: today } } }, today));
        }}
        onExit={() => setDrill(null)}
      />
    );
  }

  const start = () => setSession([...shuffleIds(due), ...fresh.slice(0, settings.newCount)]);
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? (xs.length > 1 ? xs.filter((y) => y !== x) : xs) : [...xs, x]);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Due for review" value={due.length} note="cards you've seen before, ready to recall again" />
        <Stat label="New cards" value={fresh.length} note={`not studied yet (${Math.min(settings.newCount, fresh.length)} per session)`} />
        <Stat label="Known" value={`${known} / ${scope.length}`} note="terms you've recalled well over a week or more" />
        <Stat label="Streak" value={`${streak(data.days, today)} day${streak(data.days, today) === 1 ? "" : "s"}`} note="days in a row you've studied" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {([["cards", "🃏 Flashcards"], ["drills", "🎯 Drills"], ["progress", "📈 Progress"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cx("rounded-lg px-4 py-2 text-sm font-semibold", tab === k ? "bg-ink text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-100")}>{l}</button>
        ))}
      </div>

      {tab === "cards" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5">
            <Field label="Which Parts?" hint="Study the terms from the Parts you've done.">
              {[1, 2, 3, 4].map((p) => <button key={p} className={chip(settings.parts.includes(p))} onClick={() => changeSettings({ ...settings, parts: toggle(settings.parts, p) })}>{PARTS[p]}</button>)}
            </Field>
            <Field label="Which levels?" hint="Start with Essential: the terms to know cold.">
              {(Object.keys(LEVELS) as Level[]).map((l) => <button key={l} className={chip(settings.levels.includes(l))} onClick={() => changeSettings({ ...settings, levels: toggle(settings.levels, l) })}>{LEVELS[l]}</button>)}
            </Field>
            <Field label="Which way round?" hint="Meaning → term is harder: try it once a term is known.">
              {([["forward", "Term → meaning"], ["reverse", "Meaning → term"], ["both", "Both"]] as const).map(([d, l]) => <button key={d} className={chip(settings.dir === d)} onClick={() => changeSettings({ ...settings, dir: d })}>{l}</button>)}
            </Field>
            <Field label="New cards per session">
              {[5, 10, 20, 50].map((n) => <button key={n} className={chip(settings.newCount === n)} onClick={() => changeSettings({ ...settings, newCount: n })}>{n}</button>)}
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
          {(Object.keys(DRILL_GROUPS) as DrillGroup[]).map((g) => (
            <section key={g}>
              <h3 className="text-lg font-bold">{DRILL_GROUPS[g].title}</h3>
              <p className="mb-3 text-sm text-stone-500">{DRILL_GROUPS[g].blurb}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {DRILLS.filter((d) => d.group === g).map((d) => {
                  const st = data.drills[d.key];
                  return (
                    <button key={d.key} onClick={() => setDrill(d.key)} className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 text-left transition hover:border-kowhai-500 hover:shadow-lg">
                      <span className="text-2xl">{d.icon}</span>
                      <span className="mt-2 text-lg font-bold group-hover:underline">{d.title}</span>
                      <span className="mt-1 flex-1 text-sm text-stone-600">{d.blurb}</span>
                      <span className="mt-3 flex items-center justify-between gap-2 text-xs">
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 font-semibold text-stone-500">{PARTS[d.part]}</span>
                        <span className="font-semibold text-kowhai-700">{st ? `Best ${st.best}/${st.total}` : `${d.length ?? 10} questions`}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === "progress" && <Progress data={data} onReset={() => { if (confirm("Reset all study progress? This can't be undone.")) save(emptyStudy()); }} />}
    </div>
  );
}

function shuffleIds(ids: string[]) {
  const a = [...ids];
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
      <p className="mt-3 text-sm">Keys: <kbd className="rounded bg-white px-1.5 ring-1 ring-stone-300">Space</kbd> to show the answer, <kbd className="rounded bg-white px-1.5 ring-1 ring-stone-300">1</kbd>–<kbd className="rounded bg-white px-1.5 ring-1 ring-stone-300">4</kbd> to mark it.</p>
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

function CardSession({ queue: start, data, today, onGrade, onExit }: { queue: string[]; data: StudyData; today: string; onGrade: (id: string, g: Grade) => void; onExit: () => void }) {
  const [queue, setQueue] = useState(start);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [tally, setTally] = useState<Record<Grade, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const id = queue[i];
  const e = id ? GLOSSARY_MAP[cardKey(id)] : undefined;
  const reverse = id?.startsWith("r:");

  const grade = useCallback((g: Grade) => {
    if (!id || !shown) return;
    onGrade(id, g);
    setTally((t) => ({ ...t, [g]: t[g] + 1 }));
    if (g === "again") setQueue((q) => [...q, id]); // see it again before the session ends
    setShown(false);
    setI((n) => n + 1);
  }, [id, shown, onGrade]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement)?.tagName?.match(/INPUT|SELECT|TEXTAREA|BUTTON/) && ev.key !== " ") return;
      if ((ev.key === " " || ev.key === "Enter") && !shown) { ev.preventDefault(); setShown(true); }
      const n = Number(ev.key);
      if (shown && n >= 1 && n <= 4) grade(GRADES[n - 1].g);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, grade]);

  if (!e) {
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
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-500">{PARTS[e.part]}</span>
          <span className="rounded-full bg-kowhai-100 px-2 py-0.5 text-kowhai-700">{LEVELS[e.level]}</span>
        </div>
        <div className="mt-4 text-sm font-semibold uppercase tracking-wider text-stone-500">{reverse ? "Which term is this?" : "What does this mean?"}</div>
        {reverse
          ? <div className="mt-2 text-xl leading-snug"><RichText text={maskTerm(e, e.short)} inlineOnly /></div>
          : <div className="mt-2 text-3xl font-bold tracking-tight">{e.term}</div>}

        {!shown ? (
          <button onClick={() => setShown(true)} className="mt-8 w-full rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">Show answer <span className="font-normal text-stone-400">(Space)</span></button>
        ) : (
          <div className="mt-6 border-t border-stone-200 pt-5">
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
            <div className="mt-6 text-sm font-semibold text-stone-600">How well did you remember it?</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map(({ g, label, cls }, n) => (
                <button key={g} onClick={() => grade(g)} className={cx("rounded-xl px-3 py-2.5 text-center font-bold", cls)}>
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

/* ───────────── progress ───────────── */

function Progress({ data, onReset }: { data: StudyData; onReset: () => void }) {
  return (
    <div className="space-y-6">
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
        </div>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-bold">Drills</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead><tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500"><th className="py-1">Drill</th><th className="py-1 text-right">Tries</th><th className="py-1 text-right">Best</th><th className="py-1 text-right">Last</th></tr></thead>
            <tbody>
              {DRILLS.map((d) => {
                const st = data.drills[d.key];
                return (
                  <tr key={d.key} className="border-b border-stone-100">
                    <td className="py-1.5">{d.icon} {d.title}</td>
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
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500">
        <span>Progress is saved in this browser only. Clearing your browser data clears it.</span>
        <button onClick={onReset} className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-50">Reset progress</button>
      </div>
    </div>
  );
}
