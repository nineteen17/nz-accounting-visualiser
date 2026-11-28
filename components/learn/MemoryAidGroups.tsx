"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AID_GROUPS, MEMORY_AIDS, type AidGroup } from "@/data/memoryAids";
import { cx } from "@/lib/ui";
import { MemoryAid } from "./MemoryAid";

const GROUPS = Object.keys(AID_GROUPS) as AidGroup[];
export const aidGroupHref = (g: AidGroup) => (g === GROUPS[0] ? "/glossary/memory-aids" : `/glossary/memory-aids?group=${g}`);

/** One tab per group (?group=nz); only the chosen group's aids are rendered. */
export function MemoryAidGroups() {
  const q = useSearchParams().get("group");
  const group: AidGroup = GROUPS.includes(q as AidGroup) ? (q as AidGroup) : GROUPS[0];
  const aids = MEMORY_AIDS.filter((a) => a.group === group);
  return (
    <>
      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="tablist" aria-label="Memory aid groups">
        {GROUPS.map((g) => {
          const on = g === group;
          const n = MEMORY_AIDS.filter((a) => a.group === g).length;
          return (
            <Link key={g} href={aidGroupHref(g)} role="tab" aria-selected={on} scroll={false}
              className={cx("rounded-2xl border px-4 py-3 transition", on ? "border-ink bg-ink text-white" : "border-stone-200 bg-white hover:border-teal-500")}>
              <span className="block font-bold">{AID_GROUPS[g].title}</span>
              <span className={cx("mt-0.5 block text-sm", on ? "text-stone-300" : "text-stone-600")}>{n} aids · {AID_GROUPS[g].blurb}</span>
            </Link>
          );
        })}
      </div>
      <section role="tabpanel" aria-label={AID_GROUPS[group].title}>
        <h2 className="text-xl font-bold">{AID_GROUPS[group].title}</h2>
        <p className="text-sm text-stone-600">{AID_GROUPS[group].blurb}</p>
        <div className="mt-2 grid items-start gap-x-4 md:grid-cols-2">
          {aids.map((a) => <MemoryAid key={a.key} k={a.key} />)}
        </div>
      </section>
    </>
  );
}
