import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FOUNDATIONS, NZ_TOPICS } from "@/data/topics";
import { CYCLE_STEPS } from "@/data/cycle";
import { EXPLORE_TOOLS } from "@/app/explore/tools";

/**
 * Real 404s for mistyped lesson / topic / step / tool addresses.
 *
 * The dynamic pages read their slug inside <Suspense> (so navigation is instant),
 * which means the page has already started streaming with status 200 before it can
 * call notFound(). Checking the slug here, before anything renders, lets an unknown
 * address get a proper 404 status while real pages keep instant navigation.
 * (The pages still call notFound() themselves as a fallback.)
 */
const KNOWN: Record<string, Set<string>> = {
  foundations: new Set(FOUNDATIONS.map((f) => f.slug)),
  nz: new Set(NZ_TOPICS.map((t) => t.slug)),
  cycle: new Set(CYCLE_STEPS.map((s) => s.slug)),
  explore: new Set(EXPLORE_TOOLS.map((t) => t.slug)),
};

export function proxy(request: NextRequest) {
  const [, section, slug, ...rest] = request.nextUrl.pathname.split("/");
  const known = KNOWN[section];
  if (known && slug && (rest.length > 0 || !known.has(slug))) {
    // rewrite to a path no route matches: Next renders the not-found page with a 404 status
    return NextResponse.rewrite(new URL("/__not-found", request.url), { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/foundations/:path+", "/nz/:path+", "/cycle/:path+", "/explore/:path+"],
};
