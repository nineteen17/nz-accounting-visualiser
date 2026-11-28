import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHECKLISTS, SECTIONS } from "@/data/books/yearEndChecklist";
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { IR4_EXERCISES } from "@/data/study/ir4";
import { GST_PERIODS, gstReturn } from "@/lib/engine/gst";
import { balances } from "@/lib/engine/ledger";
import { money } from "@/lib/money";
import { EXPLORE_TOOLS } from "@/app/explore/tools";
import { CYCLE_STEPS } from "@/data/cycle";
import { NZ_TOPICS } from "@/data/topics";
import { TOOL_LAW } from "@/lib/nz/law";
import { byDate, byMonth, bySection, clearTicks, done, loadTicks, toggleTick } from "@/lib/yearEndChecklist";

const [C1, C2] = CHECKLISTS;
const item = (c: typeof C1, id: string) => c.items.find((i) => i.id === id)!;
const has = (c: typeof C1, id: string, n: number) => expect(item(c, id).figure).toContain(money(n));

describe("the checklist's figures come from the books", () => {
  it("year 1", () => {
    const b = balances(Y1.BEFORE_CLOSING);
    has(C1, "stocktake", b["130"]);
    has(C1, "paye", -b["215"]);
    has(C1, "holiday-pay", -b["220"]);
    has(C1, "gst", gstReturn(Y1.ALL, GST_PERIODS[5]).box15);
    has(C1, "terminal", Y1.TAX.terminal);
    has(C1, "terminal", 13_742.08);
    has(C1, "ica", 3_103.56);
    Y2.PROVISIONAL.instalments.forEach((x, n) => has(C1, `next-prov-${n + 1}`, x.amount));
    expect(item(C1, "bad-debts").figure).toMatch(/Pop-Up Events/);
  });

  it("year 2", () => {
    const b = balances([Y2.OPENING_ENTRY, ...Y2.BEFORE_CLOSING]);
    has(C2, "stocktake", b["130"]);
    has(C2, "paye", -b["215"]);
    has(C2, "gst", gstReturn(Y2.LEDGER, Y2.GST_PERIODS_Y2[5]).box15);
    has(C2, "terminal", 3_318.9);
    has(C2, "ica", Y2.YEAR2_FACTS.icaClosing);
    has(C2, "instalment-3", Y2.PROVISIONAL.instalments[2].amount);
    expect(C1.items.some((i) => i.id === "instalment-3")).toBe(false);
  });

  it("next year's provisional tax adds up to this year's RIT plus 5%, cents and all", () => {
    for (const c of CHECKLISTS) {
      const rit = IR4_EXERCISES.find((e) => e.key === c.key)!.ret.boxes["30J"];
      const amounts = c.items.filter((i) => i.id.startsWith("next-prov-")).map((i) => Number(i.figure!.match(/\$([\d,.]+)/)![1].replace(/,/g, "")));
      expect(amounts).toHaveLength(3);
      expect(Math.abs(amounts.reduce((s, x) => s + x, 0) - rit * 1.05)).toBeLessThan(0.02);
    }
  });
});

describe("dates, links and explanations", () => {
  it("every date runs from balance date to the next April's terminal tax (records kept for 7 years aside)", () => {
    for (const c of CHECKLISTS) {
      const y = Number(c.yearEnd.slice(0, 4));
      for (const i of c.items) {
        expect(i.date >= c.yearEnd, i.id).toBe(true);
        if (i.id !== "records") expect(i.date <= `${y + 1}-05-07`, i.id).toBe(true);
      }
      expect(item(c, "terminal").date).toBe(`${y + 1}-04-07`);
      expect(item(c, "ir4").date).toBe(`${y + 1}-03-31`);
      expect(item(c, "records").date).toBe(`${y + 7}-03-31`);
    }
  });

  it("every link goes to a real page", () => {
    const tools = new Set(EXPLORE_TOOLS.map((t) => t.slug));
    for (const c of CHECKLISTS) for (const i of c.items) {
      if (!i.link) continue;
      const [, top, rest] = i.link.href.match(/^\/([^/]+)\/?(.*)$/)!;
      if (top === "explore") expect(tools.has(rest), i.link.href).toBe(true);
      else if (top === "nz") expect(NZ_TOPICS.some((t) => t.slug === rest), i.link.href).toBe(true);
      else if (top === "cycle") expect(CYCLE_STEPS.some((t) => t.slug === rest), i.link.href).toBe(true);
      else expect(existsSync(`app/${top}${rest ? `/${rest}` : ""}`), i.link.href).toBe(true);
    }
    expect(tools.has("year-end")).toBe(true);
  });

  it("every item has a plain-English why, and every section a common mistake", () => {
    for (const c of CHECKLISTS) for (const i of c.items) expect(i.why.length, i.id).toBeGreaterThan(40);
    for (const s of SECTIONS) expect(s.mistake.length).toBeGreaterThan(20);
    expect(TOOL_LAW["year-end"].length).toBeGreaterThan(5);
  });

  it("ids are unique, and the views show every item once", () => {
    for (const c of CHECKLISTS) {
      expect(new Set(c.items.map((i) => i.id)).size).toBe(c.items.length);
      expect(bySection(c).flatMap((s) => s.items)).toHaveLength(c.items.length);
      expect(byMonth(c).flatMap((m) => m.items)).toHaveLength(c.items.length);
      const d = byDate(c).map((i) => i.date);
      expect([...d].sort()).toEqual(d);
    }
  });
});

describe("ticks on this device", () => {
  it("survive a reload, per year, and can be cleared", () => {
    const mem = new Map<string, string>();
    const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    toggleTick(store, "y1", "stocktake");
    toggleTick(store, "y1", "gst");
    toggleTick(store, "y2", "gst");
    toggleTick(store, "y1", "gst");
    const t = loadTicks(store);
    expect(t.y1).toEqual(["stocktake"]);
    expect(done(C1, t)).toBe(1);
    expect(done(C2, t)).toBe(1);
    expect(clearTicks(store, "y1").y1).toBeUndefined();
    expect(loadTicks(store).y2).toEqual(["gst"]);
    mem.set("year-end-checklist-v1", "not json");
    expect(loadTicks(store)).toEqual({});
  });
});
