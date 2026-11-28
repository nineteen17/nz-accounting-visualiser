import { existsSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GLOSSARY, GLOSSARY_MAP } from "@/data/glossary";
import { FOUNDATIONS, NZ_TOPICS } from "@/data/topics";
import { CYCLE_STEPS } from "@/data/cycle";
import { EXPLORE_TOOLS } from "@/app/explore/tools";

const ROUTES = new Set([
  "/us-vs-nz", "/on-the-job", "/on-the-job/year-2-statements", "/cycle",
  ...FOUNDATIONS.map((f) => `/foundations/${f.slug}`),
  ...NZ_TOPICS.map((t) => `/nz/${t.slug}`),
  ...CYCLE_STEPS.map((s) => `/cycle/${s.slug}`),
  ...EXPLORE_TOOLS.map((t) => `/explore/${t.slug}`),
  // the "do it yourself" exercises: every folder under app/study with a page
  ...readdirSync("app/study", { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(`app/study/${d.name}/page.tsx`)).map((d) => `/study/${d.name}`),
]);

describe("glossary", () => {
  it("has unique keys and terms", () => {
    expect(new Set(GLOSSARY.map((e) => e.key)).size).toBe(GLOSSARY.length);
    expect(new Set(GLOSSARY.map((e) => e.term.toLowerCase())).size).toBe(GLOSSARY.length);
  });

  it("every [[link]] points to a real term, and every page link to a real page", () => {
    for (const e of GLOSSARY) {
      for (const [, k] of `${e.short} ${e.body} ${e.example ?? ""} ${e.mistake ?? ""}`.matchAll(/\[\[([^\]|]+)/g)) expect(GLOSSARY_MAP[k], `${e.key} → [[${k}]]`).toBeDefined();
      if (e.href) expect(ROUTES.has(e.href.split("?")[0]), `${e.key} → ${e.href}`).toBe(true);
      if (e.nz) expect(GLOSSARY_MAP[e.nz], `${e.key} → nz ${e.nz}`).toBeDefined();
    }
  });

  it("is ready for study: every term links somewhere, essential and working terms have a café example, essential terms a common mistake", () => {
    for (const e of GLOSSARY) {
      expect(e.href, `${e.key} has no page link`).toBeTruthy();
      if (e.level !== "reference") expect(e.example, `${e.key} has no example`).toBeTruthy();
      if (e.level === "essential") expect(e.mistake, `${e.key} has no common mistake`).toBeTruthy();
    }
  });

  it("covers the key concepts taught in the course", () => {
    for (const k of ["current-asset", "current-liability", "temporary-accounts", "accumulated-depreciation", "closing-stock", "taxable-income", "annual-leave", "gst-inclusive", "shareholder", "matching-principle"]) expect(GLOSSARY_MAP[k], k).toBeDefined();
  });
});
