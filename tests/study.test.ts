import { describe, expect, it } from "vitest";
import { addDays, loadStudy, markStudied, schedule, streak, emptyStudy, intervalLabel, recordAnswer, dueMissed, missedKey, exportStudy, parseImport } from "@/lib/study/srs";
import { DRILLS, DRILL_MAP, maskTerm, plain } from "@/data/study/drills";
import { $, $$, parseAnswer, seeded as coreSeeded, type Question } from "@/data/study/core";
import { ADJUSTMENT_POOL, EVERYDAY_POOL, PART4_POOL, closingQuestion, entryQuestion } from "@/data/study/entries";
import { MEMORY_AIDS, aidPart } from "@/data/memoryAids";
import { FOUNDATIONS, NZ_TOPICS } from "@/data/topics";
import { CYCLE_STEPS } from "@/data/cycle";
import { EXPLORE_TOOLS } from "@/app/explore/tools";
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { CASH_POOL, EQ_POOL } from "@/data/study/classify";
import { COLUMNS, YEARS, worksheetColumn } from "@/data/study/gaps";
import { CF_LABELS } from "@/lib/engine/statements";
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
        } else if (q.kind === "order") {
          expect(q.items.length, q.prompt).toBeGreaterThanOrEqual(3);
          expect(new Set(q.items).size, q.prompt).toBe(q.items.length);
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

  it("classifies Kōwhai's cash flows the way the cash flow statement does", () => {
    const section = (re: RegExp) => {
      const x = CASH_POOL.find((c) => re.test(c.t.title));
      if (!x) throw new Error(`no transaction matching ${re}`);
      return CF_LABELS[x.tag].section;
    };
    expect(section(/Buy the espresso machine/)).toBe("investing");
    expect(section(/Pay the lease bond/)).toBe("investing");
    expect(section(/Borrow/)).toBe("financing");
    expect(section(/buy shares/)).toBe("financing");
    expect(section(/drawings/)).toBe("financing");
    expect(section(/fully imputed dividend/)).toBe("financing");
    expect(section(/Pay suppliers/)).toBe("operating");
    expect(section(/PAYE & deductions/)).toBe("operating");
  });

  it("every transaction keeps the accounting equation balanced", () => {
    expect(EQ_POOL.length).toBeGreaterThan(60);
    for (const { t, A, L, E } of EQ_POOL) expect(Math.abs(A - L - E), t.title).toBeLessThan(0.005);
  });

  it("classification answers follow the rules", () => {
    const rng = seeded(21);
    for (let n = 0; n < 300; n++) {
      const tp = asChoice(DRILL_MAP.temporary.make(rng));
      const a = ACCOUNTS.find((x) => tp.prompt.includes(`**${x.name}**`))!;
      expect(tp.options[tp.answer].startsWith("Temporary"), a.name).toBe(a.type === "income" || a.type === "expense" || a.code === "320");

      const tb = asChoice(DRILL_MAP["tb-errors"].make(rng));
      if (tb.options.includes("Yes, it still balances")) expect(tb.options[tb.answer] === "Yes, it still balances").toBe(tb.explain.includes("It's an error of"));

      const doc = asChoice(DRILL_MAP["source-doc"].make(rng));
      expect(doc.options[doc.answer]).not.toMatch(/Internal/);

      const dl = asChoice(DRILL_MAP.deadlines.make(rng));
      if (/terminal tax/.test(dl.prompt)) expect(dl.options[dl.answer]).toBe(/has a tax agent/.test(dl.prompt) ? "7 April 2028" : "7 February 2028");
      if (/IR4/.test(dl.prompt)) expect(dl.options[dl.answer]).toBe(/tax agent/.test(dl.prompt) && !/without/.test(dl.prompt) ? "31 March 2028" : "7 July 2027");
    }
  });

  it("regenerates exactly the same question from the same seed (so missed ones can come back)", () => {
    for (const d of DRILLS) {
      for (const seed of [1, 42, 99_999]) {
        const a = d.make(coreSeeded(seed)), b = d.make(coreSeeded(seed));
        expect(JSON.stringify(b), d.key).toBe(JSON.stringify(a));
      }
    }
  });

  it("every drill links to a page that exists", () => {
    const routes = new Set(["/cycle", "/glossary", "/glossary/memory-aids", "/on-the-job",
      ...FOUNDATIONS.map((f) => `/foundations/${f.slug}`), ...NZ_TOPICS.map((t) => `/nz/${t.slug}`),
      ...CYCLE_STEPS.map((s) => `/cycle/${s.slug}`), ...EXPLORE_TOOLS.map((t) => `/explore/${t.slug}`)]);
    for (const d of DRILLS) expect(routes.has(d.learn.href.split("?")[0]), `${d.key} → ${d.learn.href}`).toBe(true);
    for (const a of MEMORY_AIDS) expect([1, 2, 3, 4]).toContain(aidPart(a));
  });

  it("closing entries use Kōwhai's real year-end balances and profit", () => {
    const rng = seeded(5);
    const profits = new Set([Y1.NET_PROFIT, Y2.NET_PROFIT]);
    let summary = 0;
    for (let n = 0; n < 200; n++) {
      const q = closingQuestion(rng);
      const close = q.lines.find((l) => l.account === "320")!;
      expect(close, q.prompt).toBeDefined();
      if (q.lines.some((l) => l.account === "310")) {
        summary++;
        expect(profits.has(close.amount)).toBe(true);
        expect(q.lines.find((l) => l.account === "310")!.side).toBe("credit");
      } else {
        const other = q.lines.find((l) => l.account !== "320")!;
        const acc = ACCOUNTS.find((a) => a.code === other.account)!;
        // income is closed with a debit, expenses with a credit
        expect(other.side, acc.name).toBe(acc.type === "income" ? "debit" : "credit");
        expect(["income", "expense"]).toContain(acc.type);
      }
    }
    expect(summary).toBeGreaterThan(20);
    // the real closing entries close the same income summary amount
    expect(Y1.CLOSING.some((t) => t.lines.some((l) => l.account === "310" && Math.abs((l.credit ?? 0) - Y1.NET_PROFIT) < 0.005))).toBe(true);
  });

  it("year 2 entries cover the Part 4 topics", () => {
    const titles = PART4_POOL.map((t) => t.title).join(" | ");
    for (const re of [/Reverse/, /Sell the old/, /dividend/i, /provisional tax/i]) expect(titles, `${re}`).toMatch(re);
  });

  it("works out the Phase 3 sums correctly", () => {
    const rng = seeded(8);
    for (let n = 0; n < 300; n++) {
      const t = asNumber(DRILL_MAP["t-account"].make(rng));
      // re-add the listed moves and the opening balance
      const opening = Number(/balance of \*\*\$([\d,]+)/.exec(t.prompt)![1].replace(/,/g, ""));
      const normal = /\*\*debit\*\* balance/.test(t.prompt) ? 1 : -1;
      let bal = opening * normal;
      for (const [, side, amt] of t.prompt.matchAll(/- (Debit|Credit) \$([\d,]+)/g)) bal += (side === "Debit" ? 1 : -1) * Number(amt.replace(/,/g, ""));
      expect(t.answer, t.prompt).toBe(Math.abs(bal));
      expect(bal * normal).toBeGreaterThan(0);

      const imp = asNumber(DRILL_MAP.imputation.make(rng));
      const cash = Number(/dividend of \*\*\$([\d,]+)/.exec(imp.prompt)![1].replace(/,/g, ""));
      const ic = Math.round(((cash * 28) / 72) * 100) / 100;
      if (/imputation credit\]\] is attached/.test(imp.prompt)) expect(imp.answer).toBeCloseTo(ic, 2);
      if (/What.s the \*\*gross dividend/.test(imp.prompt)) expect(imp.answer).toBeCloseTo(cash + ic, 2);
      if (/dividend RWT\*\* must/.test(imp.prompt)) expect(imp.answer).toBeCloseTo((cash + ic) * 0.33 - ic, 1);

      const g = asNumber(DRILL_MAP["gst-return"].make(rng));
      const [sales, purchases] = [...g.prompt.matchAll(/(?:Sales|tax invoices): \*\*\$([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, "")));
      expect(g.answer).toBeCloseTo(((sales - purchases) * 3) / 23, 1);
    }
    // a $72,000 dividend carries $28,000 of credits: the $100,000 profit it came from, taxed at 28%
    expect(Math.round((72_000 * 28) / 72)).toBe(28_000);
  });

  it("brings missed questions back, and drops them once they're right twice", () => {
    let d = emptyStudy();
    const today = "2026-11-27";
    d = recordAnswer(d, "gst", 7, true, today);
    expect(Object.keys(d.missed)).toHaveLength(0); // right first time: nothing saved
    d = recordAnswer(d, "gst", 7, false, today);
    expect(dueMissed(d, today)).toHaveLength(0); // not again today
    expect(dueMissed(d, addDays(today, 1))).toHaveLength(1); // back tomorrow
    d = recordAnswer(d, "gst", 7, true, addDays(today, 1));
    expect(d.missed[missedKey("gst", 7)].state.due).toBe(addDays(today, 4)); // then in 3 days
    d = recordAnswer(d, "gst", 7, false, addDays(today, 4));
    expect(d.missed[missedKey("gst", 7)].state.lapses).toBe(2); // wrong again: back to tomorrow
    d = recordAnswer(d, "gst", 7, true, addDays(today, 5));
    d = recordAnswer(d, "gst", 7, true, addDays(today, 8));
    expect(d.missed[missedKey("gst", 7)]).toBeUndefined();
    // old saved progress without missed questions still loads
    expect(loadStudy(JSON.stringify({ version: 1, cards: {}, drills: {}, days: [] })).missed).toEqual({});
    // capped, oldest dropped first
    for (let s = 0; s < 210; s++) d = recordAnswer(d, "gst", s, false, today);
    expect(Object.keys(d.missed)).toHaveLength(200);
    expect(d.missed[missedKey("gst", 0)]).toBeUndefined();
  });

  it("the worksheet and post-closing drills agree with Kōwhai's real trial balances", () => {
    for (const y of YEARS) {
      // closing adds the profit to retained earnings, and leaves income and expenses at $0
      expect(-(y.adj["310"] ?? 0) + y.profit).toBeCloseTo(-(y.post["310"] ?? 0), 2);
      for (const a of ACCOUNTS.filter((x) => x.type === "income" || x.type === "expense")) expect(Math.abs(y.post[a.code] ?? 0), a.name).toBeLessThan(0.005);
      // the worksheet's columns balance once the profit is added to the smaller P&L side
      const tot = { pd: 0, pc: 0, bd: 0, bc: 0 } as Record<keyof typeof COLUMNS, number>;
      for (const a of ACCOUNTS) { const b = y.adj[a.code] ?? 0; if (Math.abs(b) > 0.004) tot[worksheetColumn(a.code, b)] += Math.abs(b); }
      expect(tot.pc - tot.pd).toBeCloseTo(y.profit, 2);
      expect(tot.bd - tot.bc).toBeCloseTo(y.profit, 2);
    }
    // the adjusted balance asked for is the real adjusted balance
    const rng = seeded(4);
    for (let n = 0; n < 200; n++) {
      const q = DRILL_MAP.worksheet.make(rng);
      if (q.kind !== "number") continue;
      const name = /\*\*(.+?)\*\* has/.exec(q.prompt)![1];
      const acc = ACCOUNTS.find((a) => a.name === name)!;
      const y = YEARS.find((x) => q.prompt.includes(x.label))!;
      expect(q.answer, name).toBeCloseTo(Math.abs(y.adj[acc.code]), 2);
    }
  });

  it("exports progress and imports it back unchanged", () => {
    let d = emptyStudy();
    d = { ...d, cards: { "f:asset": schedule(undefined, "good", "2026-11-27"), "a:dead-clic": schedule(undefined, "easy", "2026-11-27") } };
    d = { ...d, drills: { gst: { attempts: 2, best: 9, last: 8, total: 10, when: "2026-11-27" } } };
    d = markStudied(recordAnswer(d, "order", 123, false, "2026-11-27"), "2026-11-27");
    const settings = { parts: [1, 2], levels: ["essential"], dir: "both", newCount: 20, aids: false };
    const back = parseImport(exportStudy(d, settings));
    if ("error" in back) throw new Error(back.error);
    expect(back.study).toEqual(d);
    expect(back.settings).toEqual(settings);
  });

  it("refuses files that aren't a study export, and drops broken entries", () => {
    expect("error" in parseImport("not json")).toBe(true);
    expect("error" in parseImport(JSON.stringify({ some: "other file" }))).toBe(true);
    expect("error" in parseImport(JSON.stringify({ app: "kowhai-cafe-study", study: { version: 2 } }))).toBe(true);
    const res = parseImport(JSON.stringify({
      app: "kowhai-cafe-study",
      study: {
        version: 1,
        cards: { "f:asset": { box: 2, due: "2026-12-01", reps: 2, lapses: 0 }, "f:bad": { box: 99, due: "x" }, "zz:odd": { box: 1, due: "2026-12-01", reps: 1, lapses: 0 } },
        drills: { gst: { attempts: 1, best: 5, last: 5, total: 10, when: "2026-11-27" }, bad: { attempts: "lots" } },
        missed: { "gst:7": { drill: "gst", seed: 7, state: { box: 1, due: "2026-11-28", reps: 1, lapses: 1 } }, "gst:8": { drill: "gst", seed: 9, state: { box: 1, due: "2026-11-28", reps: 1, lapses: 1 } } },
        days: ["2026-11-27", "yesterday"],
      },
    }));
    if ("error" in res) throw new Error(res.error);
    expect(Object.keys(res.study.cards)).toEqual(["f:asset"]);
    expect(Object.keys(res.study.drills)).toEqual(["gst"]);
    expect(Object.keys(res.study.missed)).toEqual(["gst:7"]);
    expect(res.study.days).toEqual(["2026-11-27"]);
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
