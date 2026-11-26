import { r2 } from "@/lib/money";
import type { DocItem, JournalLine, SourceDoc } from "@/lib/engine/types";
import { BUSINESS, SUPPLIERS, CUSTOMERS } from "../business";

export const ex = (incl: number) => r2(incl / 1.15);
export const gstOf = (incl: number) => r2(incl - ex(incl));
export const incl = (exAmt: number) => r2(exAmt * 1.15);

type SupplierKey = keyof typeof SUPPLIERS;
type CustomerKey = keyof typeof CUSTOMERS;

/** A supplier's tax invoice (taxable supply information) addressed to the café */
export function supplierInvoice(
  s: SupplierKey,
  ref: string,
  date: string,
  items: DocItem[],
  opts: { paid?: string; terms?: string; title?: string } = {},
): SourceDoc {
  const sup = SUPPLIERS[s];
  const sub = r2(items.reduce((a, i) => a + i.amount, 0));
  const gst = r2(sub * 0.15);
  return {
    kind: "tax-invoice-in",
    title: opts.title ?? "Tax Invoice",
    issuer: sup.name,
    issuerDetail: [...sup.detail, `GST No. ${sup.gst}`],
    recipient: BUSINESS.name,
    recipientDetail: BUSINESS.address,
    ref,
    date,
    items,
    totals: [
      { label: "Subtotal (excl GST)", value: money2(sub) },
      { label: "GST 15%", value: money2(gst) },
      { label: "TOTAL (incl GST)", value: money2(sub + gst), strong: true },
    ],
    footer: [
      opts.terms ?? "Payment due 20th of the month following invoice",
      "Bank: 02-0100-0999999-00",
    ],
    stamp: opts.paid,
  };
}

/** The café's own tax invoice to a customer */
export function salesInvoice(c: CustomerKey, ref: string, date: string, items: DocItem[], due = "20th of the following month"): SourceDoc {
  const cus = CUSTOMERS[c];
  const sub = r2(items.reduce((a, i) => a + i.amount, 0));
  const gst = r2(sub * 0.15);
  return {
    kind: "tax-invoice-out",
    title: "Tax Invoice",
    issuer: BUSINESS.name,
    issuerDetail: [...BUSINESS.address, `GST No. ${BUSINESS.gstNumber}`],
    recipient: cus.name,
    recipientDetail: cus.detail,
    ref,
    date,
    items,
    totals: [
      { label: "Subtotal (excl GST)", value: money2(sub) },
      { label: "GST 15%", value: money2(gst) },
      { label: "TOTAL (incl GST)", value: money2(sub + gst), strong: true },
    ],
    footer: [`Payment due: ${due}`, `Please pay to ${BUSINESS.bankAccount}, reference ${ref}`],
  };
}

export function money2(x: number) {
  return "$" + r2(x).toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Debit an expense/asset (ex GST) + claim GST, credit bank or creditors */
export function buyLines(
  account: string,
  inclAmt: number,
  creditAccount: string,
  opts: { party?: string; memo?: string; why?: string; creditWhy?: string } = {},
): JournalLine[] {
  return [
    { account, debit: ex(inclAmt), memo: opts.memo, why: opts.why },
    { account: "210", debit: gstOf(inclAmt), gst: "input", memo: "GST claimable", why: "The GST part of the price is claimed back from IRD, so it reduces the GST the café owes." },
    { account: creditAccount, credit: inclAmt, party: opts.party, why: opts.creditWhy },
  ];
}

/** Iterate ISO months between two (inclusive) */
export function monthsBetween(from: string, to: string) {
  const out: string[] = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export function lastDay(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const days = [31, y % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  return `${ym}-${days}`;
}
export const day = (ym: string, d: number) => `${ym}-${String(d).padStart(2, "0")}`;
export function nextMonth(ym: string) {
  let [y, m] = ym.split("-").map(Number);
  m++;
  if (m > 12) {
    m = 1;
    y++;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}
export function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}
