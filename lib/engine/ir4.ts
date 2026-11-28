/**
 * The IR4 company income tax return: the boxes Kōwhai uses, in IRD's own words, and the return worked out from the books.
 * Box numbers and wording are from IRD's IR4 2026 form (1 April 2025 to 31 March 2026) and its guide (IR4G 2026),
 * read 28 November 2026, with the years moved on to the return being filed. Plan: docs/IR4.md.
 */
import { r2 } from "@/lib/money";
import { COMPANY_TAX_RATE, PROVISIONAL_TAX } from "@/lib/nz/rates";

export const IR4_SOURCE = {
  form: "https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir1---ir99/ir4/ir4-2026.pdf",
  guide: "https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir1---ir99/ir4gu/ir4gu-2026.pdf",
  checked: "28 November 2026",
  /** the newest form IRD has published: the exercise moves its years on to the return being filed */
  formYear: 2026,
};

export type Ir4BoxKey =
  | "13A" | "13B" | "17A" | "20B" | "29" | "30A" | "30B" | "30I" | "30J" | "30K" | "30L" | "33B"
  | "41" | "42A" | "42B" | "43B" | "44";

/** IRD's wording for each box (shortened only where the form repeats itself), and what goes in it in plain English. `y` is the return's year, e.g. 2027. */
export function ir4Boxes(y: number): Record<Ir4BoxKey, { form: string; plain: string }> {
  return {
    "13A": { form: "Total RWT and/or NRWT", plain: "The RWT the bank took off the café's interest, from its RWT certificate. 0 if none." },
    "13B": { form: "Total gross interest", plain: "All the NZ interest the café earned, before the RWT was taken off. 0 if none." },
    "17A": { form: "Total tax credits. Add Boxes 12A, 13A, 14A, 15A and 16A.", plain: "Tax already taken off the café's income by others. Kōwhai only has RWT." },
    "20B": { form: "Net profit or loss from business or other rental", plain: "The café's profit after all allowable business expenditure, including shareholders' salaries: taxable profit, not the accounts' profit. Leave out the interest: it's already in 13B." },
    "29": { form: "Taxable income", plain: "Boxes 23, 25, 27 and 29 total the income, then take off donations, losses and group offsets. Kōwhai has none of those, so all four are 13B + 20B." },
    "30A": { form: "Copy the total from Box 29 to Box 30A. This is your taxable income.", plain: "Whole dollars only: the cents boxes are already printed as 00, so drop the cents." },
    "30B": { form: "Total tax payable. Work out the tax on taxable income at 28 cents in the dollar.", plain: "Box 30A × 28%." },
    "30I": { form: "Copy the total tax credits from Box 17A to Box 30I.", plain: "Boxes 30C to 30H (overseas tax, foreign investor credits, imputation credits received) are all nil for Kōwhai, so 30H is the same as 30B." },
    "30J": { form: "Subtract Box 30I and Box 30IA from Box 30H. This is the residual income tax.", plain: "RIT: the tax still owed for the year before provisional tax. It sets next year's provisional tax." },
    "30K": { form: `Print any ${y} provisional tax paid in Box 30K.`, plain: `Every provisional tax payment for the ${y} year, including any paid after 31 March.` },
    "30L": { form: "If Box 30J is a debit, subtract Box 30K from Box 30J. This is the tax to pay. If Box 30K is larger than Box 30J, the difference is the refund.", plain: "Terminal tax (to pay), or a refund. Type it without a minus sign and tick which." },
    "33B": { form: `Print the company's ${y + 1} provisional tax payable in Box 33B if you're using S or E.`, plain: `Standard option (S): this year's RIT plus ${Math.round(PROVISIONAL_TAX.standardUplift * 100)}%. Whole dollars: drop the cents.` },
    "41": { form: `Print the opening balance at 1 April ${y - 1} in Box 41. This is the same as the closing balance at 31 March ${y - 1}.`, plain: "The imputation credit account's balance at the start of the tax year. A new company writes 0." },
    "42A": { form: `Income tax paid for 1989 and subsequent years`, plain: `Income tax and provisional tax the company paid between 1 April ${y - 1} and 31 March ${y}, by the date it was paid.` },
    "42B": { form: "RWT on interest received", plain: "The RWT taken off the company's interest in the tax year." },
    "43B": { form: "Imputation credits attached to dividends paid.", plain: "The credits passed on to the shareholders with any dividend paid in the tax year." },
    "44": { form: `Closing balance at 31 March ${y}`, plain: "Box 41 + Box 42E (the credits) − Box 43D (the debits)." },
  };
}

export type Ir4Shareholder = { name: string; salary: number; currentAccount: number };
export type IcaEntry = { date: string; label: string; credit: number; debit: number };

export type Ir4 = {
  /** the income year the return is for, e.g. 2027 for 1 April 2026 to 31 March 2027 */
  year: number;
  boxes: Record<Ir4BoxKey, number>;
  /** 30L: tax to pay, or a refund */
  pay: boolean;
  /** Box 32: the date the company started to derive income, if it's the first year */
  startDate?: string;
  shareholders: Ir4Shareholder[];
};

/** The tax year an ICA entry falls in: 1 April to 31 March, named for the year it ends in (the imputation return is always for the tax year, whatever the balance date). */
export const taxYearOf = (iso: string) => Number(iso.slice(0, 4)) + (iso.slice(5) >= "04-01" ? 1 : 0);

/** Taxable income → the IR4's boxes, the way the form works them out */
export function ir4Return(input: {
  year: number;
  taxableIncome: number;
  interest: number;
  rwt: number;
  provisionalPaid: number;
  startDate?: string;
  shareholders: Ir4Shareholder[];
  ica: IcaEntry[];
}): Ir4 {
  const { year } = input;
  const b13A = r2(input.rwt), b13B = r2(input.interest), b17A = b13A;
  const b29 = r2(input.taxableIncome);
  const b20B = r2(b29 - b13B);
  const b30A = Math.floor(b29);
  const b30B = r2(b30A * COMPANY_TAX_RATE);
  const b30J = r2(b30B - b17A);
  const b30K = r2(input.provisionalPaid);
  const b30L = r2(b30J - b30K);
  const b33B = Math.floor(b30J * (1 + PROVISIONAL_TAX.standardUplift) + 1e-9);
  const before = input.ica.filter((e) => taxYearOf(e.date) < year);
  const inYear = input.ica.filter((e) => taxYearOf(e.date) === year);
  const sum = (es: IcaEntry[], f: (e: IcaEntry) => number) => r2(es.reduce((s, e) => s + f(e), 0));
  const b41 = sum(before, (e) => e.credit - e.debit);
  const b42B = sum(inYear.filter((e) => /RWT/.test(e.label)), (e) => e.credit);
  const b42A = r2(sum(inYear, (e) => e.credit) - b42B);
  const b43B = sum(inYear, (e) => e.debit);
  return {
    year,
    boxes: { "13A": b13A, "13B": b13B, "17A": b17A, "20B": b20B, "29": b29, "30A": b30A, "30B": b30B, "30I": b17A, "30J": b30J, "30K": b30K,
      "30L": Math.abs(b30L), "33B": b33B, "41": b41, "42A": b42A, "42B": b42B, "43B": b43B, "44": r2(b41 + b42A + b42B - b43B) },
    pay: b30L >= 0,
    startDate: input.startDate,
    shareholders: input.shareholders,
  };
}
