import Link from "next/link";
import { AID_MAP, type MemoryAid as Aid } from "@/data/memoryAids";
import { RichText } from "./RichText";
import { cx } from "@/lib/ui";

/**
 * A "🧠 Remember it" card: the memory aid, what each part stands for, why it works,
 * and a café example. `compact` folds the explanation away (for tasks and the glossary panel).
 */
export function MemoryAid({ k, compact, link = true, className }: { k: string; compact?: boolean; link?: boolean; className?: string }) {
  const a = AID_MAP[k];
  if (!a) return null;
  return (
    <div className={cx("my-4 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3", className)}>
      <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">🧠 Remember it · {a.topic}</div>
      <div className="mt-1 text-lg font-bold leading-snug text-ink">{a.hook}</div>
      {a.parts && <Parts a={a} />}
      {compact ? (
        <details className="group mt-2 text-sm">
          <summary className="cursor-pointer select-none font-semibold text-teal-800 hover:underline">Why it works</summary>
          <Body a={a} link={link} />
        </details>
      ) : (
        <Body a={a} link={link} />
      )}
    </div>
  );
}

function Parts({ a }: { a: Aid }) {
  // short parts (letters, "Add GST") sit in a row of chips; long ones (CROPOC) get a list
  const long = a.parts!.some(([, v]) => v.length > 28);
  if (long) {
    return (
      <ul className="mt-2 space-y-1 text-sm">
        {a.parts!.map(([l, v], i) => (
          <li key={i} className="flex gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-teal-600 font-bold text-white">{l}</span>
            <span className="pt-0.5 text-stone-700">{v}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
      {a.parts!.map(([l, v], i) => (
        <span key={i} className="inline-flex items-center overflow-hidden rounded-md bg-white ring-1 ring-teal-200">
          <span className="bg-teal-600 px-1.5 py-0.5 font-bold text-white">{l}</span>
          <span className="px-1.5 py-0.5 text-stone-700">{v}</span>
        </span>
      ))}
    </div>
  );
}

function Body({ a, link }: { a: Aid; link: boolean }) {
  return (
    <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-stone-700">
      <div><RichText text={a.why} inlineOnly /></div>
      {a.example && (
        <div className="text-sm"><span className="font-semibold text-stone-500">☕ At Kōwhai: </span><RichText text={a.example} inlineOnly /></div>
      )}
      {link && (
        <Link href={a.learn.href} className="inline-block text-sm font-semibold text-teal-800 underline">Learn it in full: {a.learn.label} →</Link>
      )}
    </div>
  );
}
