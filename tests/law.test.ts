import { describe, expect, it } from "vitest";
import { NZ_TOPICS } from "@/data/topics";
import { ACTS, LAW, TOOL_LAW, lawUrl } from "@/lib/nz/law";
import { EXPLORE_TOOLS } from "@/app/explore/tools";

describe("The law on each NZ topic (lib/nz/law.ts)", () => {
  it("every NZ topic has at least one law reference", () => {
    for (const t of NZ_TOPICS) expect(LAW[t.slug]?.length ?? 0, t.slug).toBeGreaterThan(0);
  });
  it("has no references for topics that don't exist", () => {
    const slugs = new Set(NZ_TOPICS.map((t) => t.slug));
    for (const k of Object.keys(LAW)) expect(slugs.has(k), k).toBe(true);
  });
  it("tool law is only for Explore tools that exist", () => {
    for (const k of Object.keys(TOOL_LAW)) expect(EXPLORE_TOOLS.some((t) => t.slug === k), k).toBe(true);
  });
  it("each reference is complete and links to the official site", () => {
    for (const refs of [...Object.values(LAW), ...Object.values(TOOL_LAW)])
      for (const r of refs) {
        expect(ACTS[r.act]).toBeDefined();
        expect(r.anchor).toMatch(/^(DLM|LMS)\d+$/);
        expect(r.says.length).toBeGreaterThan(20);
        expect(lawUrl(r)).toMatch(/^https:\/\/www\.legislation\.govt\.nz\/act\/public\/\d{4}\/\d+\/en\/latest\/#(DLM|LMS)\d+$/);
      }
  });
  it("no section is listed twice on one topic", () => {
    for (const [slug, refs] of Object.entries(LAW)) {
      const keys = refs.map((r) => `${r.act} ${r.section}`);
      expect(new Set(keys).size, slug).toBe(keys.length);
    }
  });
});
