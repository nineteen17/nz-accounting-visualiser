// `npm run law`: checks every section in lib/nz/law.ts against the latest version of its Act
// on legislation.govt.nz. See README "Updating the rates" and docs/LAW-LOOKUP.md.
//
// For each Act: has a newer version been published since we checked?
// For each section: does it still exist, is its heading the same, and has it been amended
// (or is an amendment waiting to take effect) since the date we checked it?
// Anything flagged needs its "says" summary re-read against the Act.
//
// Downloads each Act once (the Income Tax Act is about 30 MB), so it takes a minute or two.
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../lib/nz/law.ts", import.meta.url), "utf8");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const toDate = (d, m, y) => new Date(Date.UTC(+y, MONTHS.indexOf(m), +d));
const parseDate = (s) => { const m = s.match(/(\d{1,2}) (\w+) (\d{4})/); return m ? toDate(m[1], m[2], m[3]) : null; };

// LAW_SINCE="1 January 2025" npm run law: list amendments since another date (for testing, or catching up)
const checkedText = process.env.LAW_SINCE ?? src.match(/LAW_CHECKED = "([^"]+)"/)[1];
const checked = parseDate(checkedText);

const acts = {};
for (const m of src.matchAll(/^\s+(\w+): \{ name: "([^"]+)", year: (\d+), no: (\d+), versionAsAt: "([^"]+)"(, kind: "regulation")? \}/gm))
  acts[m[1]] = { name: m[2], year: m[3], no: m[4], versionAsAt: m[5], regulation: !!m[6] };

const refs = [];
for (const m of src.matchAll(/\{ act: "(\w+)", section: "([^"]+)", heading: "([^"]+)", anchor: "([^"]+)"/g))
  refs.push({ act: m[1], section: m[2], heading: m[3], anchor: m[4] });

const unhtml = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#39;|&rsquo;|&lsquo;/g, "’").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/\s+/g, " ").trim();
const same = (a, b) => a.replace(/[’']/g, "'").toLowerCase() === b.replace(/[’']/g, "'").toLowerCase();

let problems = 0;
const seen = new Set();
console.log(`Checking ${refs.length} sections in ${Object.keys(acts).length} Acts, last checked ${checkedText}.\n`);

for (const [key, act] of Object.entries(acts)) {
  const mine = refs.filter((r) => r.act === key);
  if (!mine.length) continue;
  const url = `https://www.legislation.govt.nz/${act.regulation ? "secondary-legislation/pco-drafted" : "act/public"}/${act.year}/${act.no}/en/latest/`;
  let html;
  try {
    // large Acts are sometimes cut off mid-download: retry until the page is complete
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(url, { headers: { "user-agent": "curl/8.0" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        html = await res.text();
        if (!html.trimEnd().endsWith("</html>") || !html.includes("legislation-side-nav__link--prov")) throw new Error("incomplete download");
        break;
      } catch (e) {
        if (attempt >= 4) throw e;
      }
    }
  } catch (e) {
    console.log(`✗ ${act.name}: couldn't download (${e.message}). Try again later.`);
    problems++;
    continue;
  }

  // an Act says "Version as at 1 July 2025"; a regulation that's never been amended says "Latest version (as made)"
  const version = unhtml(html.match(/Version as at[^<]*/)?.[0] ?? "").replace("Version as at ", "") || (html.match(/Latest version\s*<\/span>\s*<span[^>]*>\s*\(([^)]+)\)/)?.[1] ?? "");
  const newer = version && version !== act.versionAsAt;
  console.log(`${newer ? "!" : "✓"} ${act.name}: ${version === "as made" ? "as made (never amended)" : `version as at ${version || "?"}`}${newer ? ` (we checked ${act.versionAsAt}: update versionAsAt once the sections below are re-read)` : ""}`);
  if (newer) problems++;

  // the side menu lists every section in order: anchor, number, heading
  const nav = [...html.matchAll(/legislation-side-nav__link--prov"[^>]*href="#((?:DLM|LMS)\d+)"[^>]*>[\s\S]*?<div class=.col-2.>\s*([\s\S]*?)\s*<\/div>\s*<div class="col">\s*([\s\S]*?)\s*<\/div>/g)]
    .map((m) => ({ at: m.index, anchor: m[1], num: unhtml(m[2]), heading: unhtml(m[3]) }));
  // a schedule's menu entry has one column: "Schedule Matters that financial statements must show"
  for (const m of html.matchAll(/legislation-side-nav__link--schedule"[^>]*href="#((?:DLM|LMS)\d+)"[^>]*>[\s\S]*?<div class="col">\s*([\s\S]*?)\s*<\/div>/g)) {
    const [, num, heading] = unhtml(m[2]).match(/^(Schedule(?: \d+\w*)?) (.*)$/) ?? [null, "Schedule", unhtml(m[2])];
    nav.push({ at: m.index, anchor: m[1], num, heading });
  }
  nav.sort((a, b) => a.at - b.at);
  const navIndex = new Map(nav.map((n, i) => [n.anchor, i]));

  for (const r of mine) {
    const id = `${key}:${r.section}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const label = `   ${r.section.startsWith("Schedule") ? "" : act.regulation ? "cl " : "s "}${r.section} ${r.heading}`;
    const i = navIndex.get(r.anchor);
    if (i === undefined) { console.log(`${label}\n     ✗ not found: the section may have been repealed or renumbered`); problems++; continue; }
    const n = nav[i];
    const issues = [];
    if (n.num !== r.section) issues.push(`now numbered ${n.num}`);
    if (!same(n.heading, r.heading)) issues.push(`heading is now "${n.heading}"`);

    // the section's text runs from its anchor to the next section's anchor
    const start = html.indexOf(`id="${r.anchor}"`);
    const nextAnchor = nav[i + 1]?.anchor;
    const end = nextAnchor ? html.indexOf(`id="${nextAnchor}"`, start + 1) : -1;
    const text = start < 0 ? "" : unhtml(html.slice(start, end > start ? end : start + 200_000));
    if (/\[Repealed\]\s*$/.test(text.slice(0, 200)) || /^\S+ \[Repealed\]/.test(text)) issues.push("repealed");
    const amended = [...text.matchAll(/(?:amended|replaced|inserted|repealed|substituted)[^.]{0,60}?on (\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})/g)]
      .map((m) => toDate(m[1], m[2], m[3])).filter((d) => d > checked);
    if (amended.length) {
      const dates = [...new Set(amended.sort((a, b) => a - b).map((d) => d.toISOString().slice(0, 10)))];
      const future = dates.filter((d) => d > new Date().toISOString().slice(0, 10));
      issues.push(`amended since ${checkedText}: ${dates.join(", ")}${future.length ? ` (not in force until ${future.join(", ")})` : ""}`);
    }
    if (issues.length) { console.log(`${label}\n     ! ${issues.join("; ")}`); problems++; }
  }
}

console.log(problems
  ? `\n${problems} thing(s) to look at. Re-read each flagged section, update its "says" in lib/nz/law.ts (and the topic page if the rule changed), then update versionAsAt and LAW_CHECKED.`
  : `\nAll ${seen.size} sections unchanged since ${checkedText}. Update LAW_CHECKED to today's date.`);
process.exitCode = problems ? 1 : 0;
