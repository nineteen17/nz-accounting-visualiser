import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
import { FOUNDATIONS, NZ_TOPICS } from "@/data/topics";
import { CYCLE_STEPS } from "@/data/cycle";
import { EXPLORE_TOOLS } from "@/app/explore/tools";

const status = (path: string) => proxy(new NextRequest(`http://localhost:3000${path}`)).status;

describe("proxy: real 404s for unknown slugs", () => {
  it("lets every real page through", () => {
    const real = [
      ...FOUNDATIONS.map((f) => `/foundations/${f.slug}`),
      ...NZ_TOPICS.map((t) => `/nz/${t.slug}`),
      ...CYCLE_STEPS.map((s) => `/cycle/${s.slug}`),
      ...EXPLORE_TOOLS.map((t) => `/explore/${t.slug}`),
      "/cycle/year",
      "/nz/gst-return?period=P3",
    ];
    for (const p of real) expect(status(p), p).toBe(200);
  });
  it("returns 404 for unknown or extra path segments", () => {
    for (const p of ["/foundations/nope", "/nz/nope", "/cycle/nope", "/explore/nope", "/cycle/post/extra"]) expect(status(p), p).toBe(404);
  });
});
