import { describe, expect, it } from "vitest";
import { AID_MAP, MEMORY_AIDS, aidsForStep } from "@/data/memoryAids";
import { GLOSSARY_MAP } from "@/data/glossary";
import { FOUNDATIONS, NZ_TOPICS } from "@/data/topics";
import { CYCLE_STEPS } from "@/data/cycle";
import { JOB_YEARS } from "@/data/job/years";
import { PROVISIONAL_TAX } from "@/lib/nz/rates";
import * as Y2 from "@/data/books/year2";

const ROUTES = new Set([
  "/cycle",
  ...FOUNDATIONS.map((f) => `/foundations/${f.slug}`),
  ...NZ_TOPICS.map((t) => `/nz/${t.slug}`),
  ...CYCLE_STEPS.map((s) => `/cycle/${s.slug}`),
]);

describe("memory aids", () => {
  it("have unique keys, real glossary terms, real links and valid [[term]] references", () => {
    expect(new Set(MEMORY_AIDS.map((a) => a.key)).size).toBe(MEMORY_AIDS.length);
    for (const a of MEMORY_AIDS) {
      for (const t of a.terms) expect(GLOSSARY_MAP[t], `${a.key}: term ${t}`).toBeDefined();
      expect(ROUTES.has(a.learn.href), `${a.key}: ${a.learn.href}`).toBe(true);
      for (const [, k] of `${a.why} ${a.example ?? ""}`.matchAll(/\[\[([^\]|]+)/g)) expect(GLOSSARY_MAP[k], `${a.key}: [[${k}]]`).toBeDefined();
    }
  });

  it("only point tasks at aids that exist, and every NZ/process aid shows up on some task", () => {
    const used = new Set<string>();
    for (const y of [1, 2] as const) for (const s of JOB_YEARS[y].steps) for (const k of aidsForStep(s.id, s.title)) { expect(AID_MAP[k], k).toBeDefined(); used.add(k); }
    for (const k of ["gst-3-23", "gst-due", "paye-20th", "provisional-dates", "imputation-28-72", "cropoc", "bank-side", "never-bank", "accrued-prepaid", "trip-meter", "movie-photo"]) expect(used.has(k), k).toBe(true);
  });

  it("use numbers that match the café's books and the NZ rules", () => {
    expect(5.75 * 3 / 23).toBeCloseTo(0.75, 10); // the flat white example
    expect(PROVISIONAL_TAX.instalments).toEqual(["28 August", "15 January", "7 May"]);
    expect(Y2.DIVIDEND.cash * 28 / 72).toBeCloseTo(7777.78, 2);
    expect(AID_MAP["imputation-28-72"].example).toContain("$7,777.78");
    expect(Y2.PROVISIONAL.instalments.map((i) => i.date)).toEqual(["2027-08-28", "2028-01-15", "2028-05-07"]);
    for (const i of Y2.PROVISIONAL.instalments) expect(AID_MAP["provisional-dates"].example).toContain("$" + i.amount.toLocaleString("en-NZ", { minimumFractionDigits: 2 }));
  });

  it("'adjustments never touch the bank' is true for every adjustment in both years", async () => {
    const { ADJUSTMENTS: A1 } = await import("@/data/books");
    for (const t of [...A1, ...Y2.ADJUSTMENTS]) for (const l of t.lines) expect(["100", "105"], t.id).not.toContain(l.account);
  });
});
