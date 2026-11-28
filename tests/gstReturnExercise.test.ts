import { describe, expect, it } from "vitest";
import { GST_EXERCISES } from "@/data/study/gstReturn";
import { ALL as Y1_ALL } from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { answerKey, boxesFor, loadProgress, markBox, saveProgress } from "@/lib/study/gstReturn";

const txnsFor = (year: string) => (year === "Year 1" ? Y1_ALL : Y2.ALL);

describe("Do the GST return yourself", () => {
  it("has all twelve periods, simpler first, starting with year 1 June–July", () => {
    expect(GST_EXERCISES).toHaveLength(12);
    expect(GST_EXERCISES[0].period.label).toBe("June–July 2026");
    const levels = GST_EXERCISES.map((e) => e.level);
    expect(levels.indexOf("harder")).toBeGreaterThan(levels.lastIndexOf("simpler"));
  });
  it.each(GST_EXERCISES.map((e) => [e.key, e] as const))("%s: the right sorting gives the real return's boxes", (_k, ex) => {
    const b = boxesFor(ex.items, answerKey(ex));
    for (const k of ["box5", "box8", "box9", "box10", "box11", "box12", "box13", "box14", "box15"] as const) expect(b[k], k).toBeCloseTo(ex.real[k], 1);
  });
  it.each(GST_EXERCISES.map((e) => [e.key, e] as const))("%s: every GST transaction appears once, and distractors have no GST", (_k, ex) => {
    const ids = ex.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    const gstIds = new Set([...ex.real.outputLines, ...ex.real.inputLines, ...ex.real.adjustments].map((l) => l.txn.id));
    for (const id of gstIds) expect(ids).toContain(id);
    const txns = txnsFor(ex.year);
    for (const i of ex.items.filter((x) => x.place === "none")) {
      const t = txns.find((x) => x.id === i.id)!;
      expect(t.lines.some((l) => l.account === "210" && l.gst && l.gst !== "settlement"), i.id).toBe(false);
    }
    const none = ex.items.filter((x) => x.place === "none").length;
    expect(none).toBeGreaterThanOrEqual(4);
    expect(none).toBeLessThanOrEqual(8);
  });
  it("the refund period gives a refund", () => {
    const ex = GST_EXERCISES.find((e) => e.key === "y1-P1")!;
    expect(ex.tags).toContain("refund");
    expect(boxesFor(ex.items, answerKey(ex)).box15).toBeLessThan(0);
  });
  it("boxes are marked against the learner's own sorting", () => {
    const ex = GST_EXERCISES[0];
    const sort = answerKey(ex);
    const sale = ex.items.find((i) => i.place === "sale")!;
    sort[sale.id] = "none";
    const own = boxesFor(ex.items, sort);
    expect(own.box5).toBeCloseTo(ex.real.box5 - sale.amount, 2);
    expect(markBox("box5", own.box5, own)).toBe(true);
    expect(markBox("box5", ex.real.box5, own)).toBe(false);
    expect(markBox("box15", Math.abs(own.box15), own)).toBe(true);
  });
  it("saved progress survives a reload, keeping the better attempt", () => {
    const mem = new Map<string, string>();
    const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    saveProgress(store, "y1-P2", { sorted: 10, of: 20, boxes: 5, done: "2026-11-28" });
    saveProgress(store, "y1-P2", { sorted: 8, of: 20, boxes: 8, done: "2026-11-29" });
    expect(loadProgress(store)["y1-P2"].sorted).toBe(10);
    expect(loadProgress(undefined)).toEqual({});
  });
});
