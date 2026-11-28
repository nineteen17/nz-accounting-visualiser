import { describe, expect, it } from "vitest";
import { IR4_EXERCISES } from "@/data/study/ir4";
import { TAX as Y1_TAX, BEFORE_CLOSING as Y1_BEFORE } from "@/data/books";
import { TAX as Y2_TAX, BEFORE_CLOSING as Y2_BEFORE, YEAR2_FACTS } from "@/data/books/year2";
import { balances } from "@/lib/engine/ledger";
import { taxYearOf } from "@/lib/engine/ir4";
import { answerKey, entryGroups, expected, isRight, loadProgress, ownPay, saveProgress, taxableFrom, type EntryKey } from "@/lib/study/ir4";

const [Y1, Y2] = IR4_EXERCISES;
const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.005);

describe("the IR4 returns", () => {
  it("add up the way the form says", () => {
    for (const ex of IR4_EXERCISES) {
      const b = ex.ret.boxes;
      near(b["17A"], b["13A"]);
      near(b["29"], b["13B"] + b["20B"]);
      expect(b["30A"]).toBe(Math.floor(b["29"]));
      near(b["30B"], b["30A"] * 0.28);
      near(b["30I"], b["17A"]);
      near(b["30J"], b["30B"] - b["30I"]);
      near(b["30L"], Math.abs(b["30J"] - b["30K"]));
      expect(b["33B"]).toBe(Math.floor(b["30J"] * 1.05));
      near(b["44"], b["41"] + b["42A"] + b["42B"] - b["43B"]);
    }
  });

  it("match the books: tax expense, terminal tax and taxable income", () => {
    for (const [ex, tax, before] of [[Y1, Y1_TAX, Y1_BEFORE], [Y2, Y2_TAX, Y2_BEFORE]] as const) {
      const b = balances(before);
      near(ex.ret.boxes["30B"], b["690"]);
      near(ex.ret.boxes["29"], tax.taxableIncome);
      near(ex.ret.boxes["30L"], tax.terminal);
      expect(ex.ret.pay).toBe(true);
      near(ex.ret.shareholders.reduce((s, x) => s + x.salary, 0), b["605"]);
    }
    near(Y1.ret.boxes["30L"], 13_742.08);
    near(Y2.ret.boxes["30L"], 3_318.9);
  });

  it("year 1's Box 33B is year 2's standard provisional tax, cents dropped", () => {
    expect(Y1.ret.boxes["33B"]).toBe(Math.floor(Y2_TAX.provisional));
  });

  it("the imputation return follows the ICA by tax year", () => {
    near(Y1.ret.boxes["41"], 0);
    near(Y2.ret.boxes["41"], Y1.ret.boxes["44"]);
    near(Y2.ret.boxes["44"], YEAR2_FACTS.icaClosing);
    expect(taxYearOf("2027-03-31")).toBe(2027);
    expect(taxYearOf("2027-04-01")).toBe(2028);
    expect(Y1.ret.startDate).toBeDefined();
    expect(Y2.ret.startDate).toBeUndefined();
  });
});

describe("step 1: profit to taxable income", () => {
  it("the right sorting gives taxable income exactly, so the no-adjustment items really need none", () => {
    for (const ex of IR4_EXERCISES) near(taxableFrom(ex, answerKey(ex)), ex.ret.boxes["29"]);
  });

  it("has both real adjustments and distractors, with titles that don't give the answer away", () => {
    for (const ex of IR4_EXERCISES) {
      expect(ex.items.filter((i) => i.dir === "none").length).toBeGreaterThanOrEqual(4);
      expect(ex.items.filter((i) => i.dir !== "none").length).toBeGreaterThanOrEqual(5);
      for (const i of ex.items) {
        expect(i.title).not.toMatch(/^(add|less|deduct)/i);
        expect(i.amount).toBeGreaterThan(0);
        expect(i.why.length).toBeGreaterThan(30);
      }
    }
  });
});

describe("step 2: marking against the learner's own boxes", () => {
  const allKeys = (ex: typeof Y1) => entryGroups(ex).flatMap((g) => g.keys);

  it("blank boxes expect Kōwhai's return", () => {
    for (const ex of IR4_EXERCISES) {
      const w = expected(ex, ex.ret.boxes["29"], {});
      for (const k of allKeys(ex)) if (!k.includes(":")) near(w[k], ex.ret.boxes[k as keyof typeof ex.ret.boxes]);
      expect(ownPay(ex, ex.ret.boxes["29"], {})).toBe(ex.ret.pay);
    }
  });

  it("the right answers, typed in, are all marked right", () => {
    for (const ex of IR4_EXERCISES) {
      const w0 = expected(ex, ex.ret.boxes["29"], {});
      const typed = Object.fromEntries(allKeys(ex).map((k) => [k, String(w0[k])])) as Partial<Record<EntryKey, string>>;
      const w = expected(ex, ex.ret.boxes["29"], typed);
      for (const k of allKeys(ex)) expect(isRight(typed[k], w[k]), k).toBe(true);
    }
  });

  it("a wrong 20B is wrong, but the boxes worked from it can still be right", () => {
    const b = Y1.ret.boxes;
    const typed: Partial<Record<EntryKey, string>> = { "13B": String(b["13B"]), "20B": "50000" };
    const w = expected(Y1, b["29"], typed);
    expect(isRight(typed["20B"], w["20B"])).toBe(false);
    near(w["29"], b["13B"] + 50_000);
    expect(w["30A"]).toBe(Math.floor(b["13B"] + 50_000));
  });

  it("a wrong taxable income in step 1 carries through to 20B", () => {
    const w = expected(Y1, 70_000, {});
    near(w["20B"], 70_000 - Y1.ret.boxes["13B"]);
  });

  it("accepts $ signs and commas", () => {
    expect(isRight("$13,742.08", 13_742.08)).toBe(true);
    expect(isRight("abc", 0)).toBe(false);
    expect(isRight("", 0)).toBe(false);
  });
});

describe("step 3 and progress", () => {
  it("each date question has one right answer among its options", () => {
    for (const ex of IR4_EXERCISES) for (const q of ex.questions) {
      expect(q.options[q.answer]).toBeDefined();
      expect(new Set(q.options).size).toBe(q.options.length);
    }
    expect(Y1.questions[0].options[Y1.questions[0].answer]).toBe("31 March 2028");
    expect(Y1.questions[1].options[Y1.questions[1].answer]).toBe("7 April 2028");
  });

  it("keeps the best result", () => {
    const mem = new Map<string, string>();
    const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    saveProgress(store, "y1", { sorted: 8, of: 10, boxes: 20, ofBoxes: 22, dates: 3, done: "2026-11-28" });
    saveProgress(store, "y1", { sorted: 5, of: 10, boxes: 10, ofBoxes: 22, dates: 1, done: "2026-11-29" });
    expect(loadProgress(store).y1.sorted).toBe(8);
  });
});
