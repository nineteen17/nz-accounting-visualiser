import Link from "next/link";

// Shown for any address that doesn't exist (Next.js's built-in 404 page).
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-sm font-semibold uppercase tracking-wider text-kowhai-700">404 · Page not found</div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">That page isn&apos;t in the books</h1>
      <p className="mt-3 text-lg text-stone-600">
        The address may be mistyped, or the page may have moved. These are the main sections:
      </p>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {[
          ["/", "Home", "What each section is for"],
          ["/foundations", "1 · Foundations", "Start here if you're new"],
          ["/cycle", "2 · Accounting cycle", "Each step, one at a time"],
          ["/nz", "3 · NZ tax & rules", "GST, PAYE, income tax and more"],
          ["/on-the-job", "4 · A year on the job", "Two years of books, task by task"],
          ["/glossary", "Glossary", "Every term, A to Z"],
        ].map(([href, t, d]) => (
          <li key={href}>
            <Link href={href} className="block rounded-xl border border-stone-200 bg-white p-4 transition hover:border-kowhai-500 hover:shadow">
              <span className="block font-semibold">{t}</span>
              <span className="block text-sm text-stone-600">{d}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
