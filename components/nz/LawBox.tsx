import { ACTS, LAW, LAW_CHECKED, lawUrl, sectionLabel, type ActKey, type LawRef } from "@/lib/nz/law";

/** "The law" on an NZ topic page: the Acts and sections behind it, with official links. */
export function LawBox({ topic }: { topic: string }) {
  const refs = LAW[topic];
  if (!refs?.length) return null;
  const byAct = new Map<ActKey, LawRef[]>();
  for (const r of refs) byAct.set(r.act, [...(byAct.get(r.act) ?? []), r]);
  return (
    <details className="group mt-12 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">⚖️ The law</div>
            <p className="mt-1 text-[15px] text-stone-700">
              The {refs.length} sections of NZ law behind this page, in plain English, with links to the Acts.
            </p>
          </div>
          <span aria-hidden className="shrink-0 text-stone-400 transition-transform group-open:rotate-180">▾</span>
        </div>
      </summary>
      <div className="mt-4 space-y-5">
        {[...byAct].map(([act, list]) => (
          <section key={act}>
            <h3 className="text-sm font-bold">{ACTS[act].name}</h3>
            <ul className="mt-2 space-y-3">
              {list.map((r) => (
                <li key={r.section} className="text-[15px] leading-relaxed">
                  <a href={lawUrl(r)} target="_blank" rel="noreferrer" className="font-semibold underline decoration-stone-300 underline-offset-2 hover:decoration-ink">
                    {sectionLabel(r)}: {r.heading}
                  </a>
                  <p className="text-stone-600">{r.says}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-xs text-stone-500">
          Read from legislation.govt.nz on {LAW_CHECKED}:{" "}
          {[...byAct.keys()].map((a) => `${ACTS[a].name} as at ${ACTS[a].versionAsAt}`).join("; ")}. Summaries are simplified: the Act&rsquo;s wording is what counts.
        </p>
      </div>
    </details>
  );
}
