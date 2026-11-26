import Link from "next/link";
import { cx } from "@/lib/ui";

/** Switch between the A–Z glossary and the memory aids cheat sheet */
export function GlossaryTabs({ current }: { current: "terms" | "aids" }) {
  const tab = (on: boolean) => cx("rounded-lg px-4 py-2 text-sm font-semibold transition", on ? "bg-ink text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100");
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Link href="/glossary" className={tab(current === "terms")}>📖 Terms A–Z</Link>
      <Link href="/glossary/memory-aids" className={tab(current === "aids")}>🧠 Memory aids</Link>
    </div>
  );
}
