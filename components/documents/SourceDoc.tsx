import type { SourceDoc as Doc } from "@/lib/engine/types";
import { nzDate, num } from "@/lib/money";
import { cx } from "@/lib/ui";
import { DOC_KIND_LABEL as KIND_LABEL } from "@/data/docKinds";

/** Renders any source document so it looks like the real thing */
export function SourceDoc({ doc }: { doc: Doc }) {
  const receiptLike = doc.kind === "receipt" || doc.kind === "z-report" || doc.kind === "deposit-slip";
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">📄 {KIND_LABEL[doc.kind]}</div>
      <div className={cx("relative mx-auto rounded-sm text-ink", receiptLike ? "doc-receipt max-w-sm px-6 py-6" : "doc-paper max-w-xl px-4 py-5 sm:px-7 sm:py-6")}>
        {doc.stamp && (
          <div className="absolute right-6 top-16 rotate-[-12deg] rounded border-4 border-emerald-600/70 px-3 py-1 text-lg font-black tracking-widest text-emerald-600/70">
            {doc.stamp}
          </div>
        )}
        <div className={cx("flex gap-x-4 gap-y-2", receiptLike ? "flex-col items-center text-center" : "flex-col sm:flex-row sm:justify-between")}>
          <div>
            <div className={cx("font-bold", receiptLike ? "text-base" : "text-lg")}>{doc.issuer}</div>
            {doc.issuerDetail?.map((d) => (
              <div key={d} className="text-xs text-stone-500">{d}</div>
            ))}
          </div>
          <div className={cx("min-w-0", receiptLike ? "" : "sm:text-right")}>
            <div className={cx("font-black uppercase tracking-wide", receiptLike ? "text-sm" : "text-xl text-stone-700")}>{doc.title}</div>
            {doc.ref && <div className="num text-xs text-stone-500">{doc.ref}</div>}
            <div className="num text-xs text-stone-500">Date: {nzDate(doc.date)}</div>
          </div>
        </div>

        {doc.recipient && (
          <div className="mt-4 text-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{doc.kind === "payslip" ? "Employee" : "To"}</div>
            <div className="font-medium">{doc.recipient}</div>
            {doc.recipientDetail?.map((d) => <div key={d} className="text-xs text-stone-500">{d}</div>)}
          </div>
        )}

        {doc.items && (
          <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-800 text-left text-[11px] uppercase tracking-wider text-stone-500">
                <th className="py-1">Description</th>
                {doc.items.some((i) => i.qty) && <th className="py-1 text-right">Qty</th>}
                {doc.items.some((i) => i.unit) && <th className="py-1 text-right">Unit</th>}
                <th className="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((it, i) => (
                <tr key={i} className="border-b border-stone-100">
                  <td className="py-1 pr-2">{it.desc}</td>
                  {doc.items!.some((x) => x.qty) && <td className="num py-1 text-right">{it.qty ?? ""}</td>}
                  {doc.items!.some((x) => x.unit) && <td className="num py-1 text-right">{it.unit ? num(it.unit) : ""}</td>}
                  <td className="num py-1 text-right">{num(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {doc.rows && (
          <dl className="mt-4 space-y-1 text-sm">
            {doc.rows.map((r, i) => (
              <div key={i} className={cx("flex justify-between gap-4 border-b border-dashed border-stone-200 py-0.5", r.strong && "border-solid border-stone-800 font-bold")}>
                <dt className="text-stone-700">{r.label}</dt>
                <dd className="num min-w-0 text-right sm:whitespace-nowrap">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {doc.totals && (
          <dl className="ml-auto mt-3 w-full max-w-xs space-y-0.5 text-sm">
            {doc.totals.map((r, i) => (
              <div key={i} className={cx("flex justify-between gap-4", r.strong && "border-t-2 border-stone-800 pt-1 text-base font-bold")}>
                <dt>{r.label}</dt>
                <dd className="num">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {doc.footer && doc.footer.length > 0 && (
          <div className="mt-5 space-y-0.5 border-t border-stone-200 pt-2 text-[11px] text-stone-500">
            {doc.footer.map((f) => <div key={f}>{f}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
