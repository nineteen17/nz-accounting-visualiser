import { describe, expect, it } from "vitest";
import { addDays, loadStudy, markStudied, schedule, streak, emptyStudy, intervalLabel } from "@/lib/study/srs";
import { DRILLS, DRILL_MAP, maskTerm, plain } from "@/data/study/drills";
import { $, $$, parseAnswer, type Question } from "@/data/study/core";
import { ADJUSTMENT_POOL, EVERYDAY_POOL, entryQuestion } from "@/data/study/entries";
import { GLOSSARY_MAP } from "@/data/glossary";
import { ACCOUNTS } from "@/data/chartOfAccounts";

/** a repeatable random number generator, so failures can be reproduced */
const seeded = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const money = (s: string) => Number(s.replace(/,/g, ""));

describe("spaced repetition", () => {
  it("moves cards up a box when remembered and back to the start when forgotten", () => {
    const t = "2026-11-27";
    const a = schedule(undefined, "good", t);
    expect(a).toMatchObject({ box: 1, due: "2026-11-28", reps: 1, lapses: 0 });
    const b = schedule(a, "good", "2026-11-28");
    expect(b).toMatchObject({ box: 2, due: "2026-12-01" });
    const c = schedule(b, "easy", "2026-12-01");
    expect(c).toMatchObject({ box: 4, due: "2026-12-15" });
    const d = schedule(c, "again", "2026-12-15");
    expect(d).toMatchObject({ box: 0, due: "2026-12-15", lapses: 1 });
    expect(schedule(d, "hard", "2026-12-15").box).toBe(1);
    expect(intervalLabel(undefined, "again")).toBe("again now");
    expect(intervalLabel(c, "good")).toBe("1 month");
    expect(intervalLabel(c, "easy")).toBe("2 months");
  });

  it("counts a streak of consecutive days and survives bad saved data", () => {
    let d = emptyStudy();
    for (const day of ["2026-11-24", "2026-11-25", "2026-11-26"]) d = markStudied(d, day);
    expect(streak(d.days, "2026-11-27")).toBe(3); // not studied yet today: streak still alive
    expect(streak(markStudied(d, "2026-11-27").days, "2026-11-27")).toBe(4);
    expect(streak(d.days, "2026-11-29")).toBe(0);
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(loadStudy("not json")).toEqual(emptyStudy());
    expect(loadStudy('{"version":2}')).toEqual(emptyStudy());
  });
});

const asChoice = (q: Question) => { if (q.kind !== "choice") throw new Error("expected a choice question"); return q; };
const asNumber = (q: Question) => { if (q.kind !== "number") throw new Error("expected a number question"); return q; };

describe("drills", () => {
  for (const d of DRILLS) {
    it(`${d.title}: 300 generated questions are all well-formed`, () => {
      const rng = seeded(d.key.length * 7919);
      for (let n = 0; n < 300; n++) {
        const q = d.make(rng);
        expect(q.explain.length).toBeGreaterThan(20);
        // links inside **bold** aren't rendered as links
        expect(`${q.prompt} ${q.explain}`, q.prompt).not.toMatch(/\*\*\[\[/);
        for (const [, k] of `${q.prompt} ${q.explain}`.matchAll(/\[\[([^\]|]+)/g)) expect(GLOSSARY_MAP[k], k).toBeDefined();
        if (q.kind === "choice") {
          expect(q.options.length, q.prompt).toBeGreaterThanOrEqual(2);
          expect(new Set(q.options).size, `duplicate options: ${q.options}`).toBe(q.options.length);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
        } else if (q.kind === "number") {
          expect(Number.isFinite(q.answer), q.prompt).toBe(true);
          // the working shown must arrive at the same answer
          const shown = q.unit === "$" ? [$(q.answer), $$(q.answer)] : [`${q.answer}`, q.answer.toFixed(2), q.answer.toFixed(1)];
          expect(shown.some((x) => q.explain.includes(x)), `${q.prompt}\n→ ${q.answer} not in: ${q.explain}`).toBe(true);
        } else {
          const dr = q.lines.filter((l) => l.side === "debit").reduce((s, l) => s + l.amount, 0);
          const cr = q.lines.filter((l) => l.side === "credit").reduce((s, l) => s + l.amount, 0);
          expect(Math.abs(dr - cr), q.prompt).toBeLessThan(0.005);
          for (const l of q.lines) expect(q.options, q.prompt).toContain(l.account);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.length).toBeGreaterThanOrEqual(q.lines.length + 3);
          expect(q.story.length).toBeGreaterThan(20);
        }
      }
    });
  }

  it("marks debit and credit lines the way the journal has them", () => {
    const rng = seeded(42);
    for (let n = 0; n < 200; n++) {
      const q = asChoice(DRILL_MAP["debit-credit"].make(rng));
      const name = q.prompt.match(/The \*\*(.+?)\*\* line/)![1];
      const a = ACCOUNTS.find((x) => x.name === name)!;
      const up = /goes \*\*up\*\*/.test(q.explain);
      expect(q.options[q.answer], q.prompt).toBe(up === (a.normal === "debit") ? "Debit" : "Credit");
    }
  });

  it("gets the GST maths right", () => {
    const rng = seeded(7);
    for (let n = 0; n < 200; n++) {
      const q = asNumber(DRILL_MAP.gst.make(rng));
      const given = money(q.prompt.match(/\*\*\$([\d,.]+)\*\*/)![1]);
      if (/How much of it is GST/.test(q.prompt)) expect(q.answer).toBeCloseTo((given * 3) / 23, 1);
      else if (/before GST\. What's the GST-inclusive/.test(q.prompt)) expect(q.answer).toBeCloseTo(given * 1.15, 1);
      else expect(q.answer).toBeCloseTo(given / 1.15, 1);
    }
  });

  it("knows the GST due-date exceptions", () => {
    const rng = seeded(3);
    let seen = 0;
    for (let n = 0; n < 300; n++) {
      const q = asChoice(DRILL_MAP.deadlines.make(rng));
      if (/last day of \*\*March\*\*/.test(q.prompt)) { expect(q.options[q.answer]).toBe("7 May"); seen++; }
      if (/last day of \*\*November\*\*/.test(q.prompt)) { expect(q.options[q.answer]).toBe("15 January"); seen++; }
      if (/last day of \*\*May\*\*/.test(q.prompt)) expect(q.options[q.answer]).toBe("28 June");
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("calculation drills agree with Kōwhai's published figures", () => {
    const found = (key: string, re: RegExp) => {
      const rng = seeded(11);
      for (let i = 0; i < 2000; i++) { const q = DRILL_MAP[key].make(rng); if (q.kind === "number" && re.test(q.prompt)) return q.answer; }
      throw new Error(`no question matching ${re}`);
    };
    // espresso machine: $16,000 at 30% DV → $4,800 then $3,360; book value $7,840 after two years
    expect(found("depreciation", /espresso[\s\S]*year 2\*\*/)).toBe(3360);
    expect(found("depreciation", /espresso[\s\S]*\*\*book value\*\* at 31 March 2028/)).toBe(7840);
    // 31 March 2027: current ratio 2.71, gross margin 70.3%; year 2 gross margin 69.6%
    expect(found("ratios", /year 1\)[\s\S]*current ratio/)).toBeCloseTo(2.71, 2);
    expect(found("ratios", /year 1\)[\s\S]*gross margin/)).toBeCloseTo(70.3, 1);
    expect(found("ratios", /year 2\)[\s\S]*gross margin/)).toBeCloseTo(69.6, 1);
  });

  it("net pay is gross less every deduction", () => {
    const rng = seeded(5);
    let seen = 0;
    for (let n = 0; n < 400; n++) {
      const q = asNumber(DRILL_MAP.payroll.make(rng));
      if (!/net \(take-home\) pay/.test(q.prompt)) continue;
      const gross = money(q.prompt.match(/Gross pay is \$([\d,]+\.\d\d)/)![1]);
      const paye = money(q.prompt.match(/earners' levy\) is \*\*\$([\d,.]+)\*\*/)![1]);
      const sl = money(q.prompt.match(/student loan is \*\*\$([\d,.]+)\*\*/)?.[1] ?? "0");
      expect(q.answer).toBeCloseTo(gross - paye - sl - Math.round(gross * 3.5) / 100, 2);
      seen++;
    }
    expect(seen).toBeGreaterThan(10);
  });

  it("journal entry questions come from real, balanced entries", () => {
    expect(EVERYDAY_POOL.length).toBeGreaterThan(40);
    expect(ADJUSTMENT_POOL.length).toBeGreaterThan(10);
    for (const t of [...EVERYDAY_POOL, ...ADJUSTMENT_POOL]) expect(entryQuestion(seeded(1), t).lines.length).toBeGreaterThanOrEqual(2);
  });

  it("reads typed answers the way people type them", () => {
    expect(parseAnswer("$1,234.50")).toBe(1234.5);
    expect(parseAnswer(" 70.3 % ")).toBe(70.3);
    expect(parseAnswer("−150")).toBe(-150);
    expect(parseAnswer("abc")).toBeNull();
  });

  it("strips markup and hides the term in meaning → term cards", () => {
    expect(plain("A [[debit|debit]] **entry** in the [[ledger]]")).toBe("A debit entry in the ledger");
    const e = GLOSSARY_MAP["accounts-receivable"];
    expect(maskTerm(e, "Accounts receivable (debtors) are debtors.")).not.toMatch(/receivable|debtors/i);
  });
});
