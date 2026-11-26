import { r2 } from "@/lib/money";

/** Standard table-loan (equal monthly repayments) amortisation */
export function amortise(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12;
  const payment = r2((principal * r) / (1 - Math.pow(1 + r, -months)));
  const rows: { n: number; opening: number; interest: number; principal: number; payment: number; closing: number }[] = [];
  let bal = principal;
  for (let n = 1; n <= months; n++) {
    const interest = r2(bal * r);
    let princ = r2(payment - interest);
    if (n === months) princ = bal;
    const closing = r2(bal - princ);
    rows.push({ n, opening: bal, interest, principal: princ, payment: r2(interest + princ), closing });
    bal = closing;
  }
  return { payment, rows };
}
