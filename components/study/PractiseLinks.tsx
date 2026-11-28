import Link from "next/link";
import { DRILLS } from "@/data/study/drills";

/**
 * The end of a lesson: drills that practise exactly this lesson, and the flashcards for its Part.
 * `href` is the lesson's own address; drills whose "revise" link points here are listed.
 * Without a Part (the explore tools), it only shows when a drill matches.
 */
export function PractiseLinks({ href, part }: { href: string; part?: 1 | 2 | 3 | 4 }) {
  const drills = DRILLS.filter((d) => d.learn.href.split("?")[0] === href);
  if (!drills.length && !part) return null;
  return (
    <div className="mt-12 rounded-2xl bg-kowhai-50 p-5 ring-1 ring-kowhai-200">
      <div className="text-xs font-semibold uppercase tracking-wider text-kowhai-700">🎯 Make it stick</div>
      <p className="mt-1 text-[15px] text-stone-700">
        {drills.length ? "Practise this lesson with questions made from Kōwhai's books, marked straight away:" : "Test yourself on the terms from this Part:"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {drills.map((d) => (
          <Link key={d.key} href={`/study?drill=${d.key}`} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold ring-1 ring-stone-300 hover:ring-kowhai-500">
            {d.icon} {d.title}
          </Link>
        ))}
        {href === "/cycle/adjustments" && (
          <Link href="/study/year-end" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold ring-1 ring-stone-300 hover:ring-kowhai-500">
            📒 Do the whole year-end yourself
          </Link>
        )}
        {href === "/nz/gst-return" && (
          <Link href="/study/gst-return" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold ring-1 ring-stone-300 hover:ring-kowhai-500">
            🧾 Do the GST return yourself
          </Link>
        )}
        {part && <Link href={`/study?part=${part}`} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold ring-1 ring-stone-300 hover:ring-kowhai-500">
          🃏 Flashcards for Part {part}
        </Link>}
      </div>
    </div>
  );
}
