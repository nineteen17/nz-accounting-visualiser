"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cx } from "@/lib/ui";

const LINKS = [
  { href: "/foundations", label: "1 · Foundations" },
  { href: "/cycle", label: "2 · Accounting cycle" },
  { href: "/nz", label: "3 · NZ tax & rules" },
  { href: "/on-the-job", label: "4 · A year on the job" },
  { href: "/explore", label: "Explore the books" },
  { href: "/study", label: "Study" },
  { href: "/glossary", label: "Glossary" },
];

export function NavLinks() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const current = LINKS.find((l) => path.startsWith(l.href));
  const linkCls = (href: string) =>
    cx("rounded-lg px-3 py-1.5 font-medium transition", path.startsWith(href) ? "bg-ink text-white" : "text-stone-700 hover:bg-stone-200/60");

  return (
    <>
      {/* wide screens: all links in a row */}
      <nav className="hidden flex-1 flex-wrap items-center justify-end gap-1 text-sm xl:flex">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
        ))}
      </nav>

      {/* phones and tablets: a menu button */}
      <div className="ml-auto flex items-center gap-2 xl:hidden">
        {current && <span className="hidden text-sm font-medium text-stone-500 sm:inline">{current.label}</span>}
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className={cx("rounded-lg border px-3 py-1.5 text-sm font-semibold", open ? "border-ink bg-ink text-white" : "border-stone-300 bg-white")}
        >
          {open ? "✕ Close" : "☰ Menu"}
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" className="absolute inset-x-0 top-full border-b border-stone-200 bg-paper px-4 pb-4 pt-2 shadow-lg xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-1 text-[15px]">
            <Link href="/" onClick={() => setOpen(false)} className={cx(linkCls("/__home"), path === "/" && "bg-ink text-white")}>Home</Link>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cx(linkCls(l.href), "py-2.5")}>{l.label}</Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
