import { r2 } from "@/lib/money";
import { assetYearOne } from "./assets";
import { COMPANY_TAX_RATE } from "./rates";
import { FIXED_ASSETS } from "@/data/business";

export interface TaxItem {
  label: string;
  amount: number; // + adds to taxable income, - reduces it
  explain: string;
}

/** Turn accounting profit into taxable income (an IR4-style tax reconciliation) */
export function taxComputation(input: { profitBeforeTax: number; entertainment: number; holidayPayAccrual: number; rwt: number; provisional: number }) {
  const assets = FIXED_ASSETS.map((a) => ({ asset: a, ...assetYearOne(a) }));
  const accountingDep = r2(assets.reduce((s, a) => s + a.accounting, 0));
  const taxDep = r2(assets.reduce((s, a) => s + a.taxDep, 0));
  const boost = r2(assets.reduce((s, a) => s + a.boost, 0));
  const items: TaxItem[] = [
    {
      label: "Add back: 50% of entertainment",
      amount: r2(input.entertainment * 0.5),
      explain: "Food and drink with a private/social element is only 50% deductible (Income Tax Act subpart DD). The non-deductible half is added back.",
    },
    {
      label: "Add back: holiday pay accrued but not paid within 63 days",
      amount: input.holidayPayAccrual,
      explain: "Accrued holiday pay is only deductible if it's paid within 63 days after balance date. Mia won't take her leave until later in the year, so it's deductible next year when she does.",
    },
    {
      label: "Add back: accounting depreciation",
      amount: accountingDep,
      explain: "The accounts' depreciation is replaced by depreciation calculated under the tax rules…",
    },
    {
      label: "Less: tax depreciation",
      amount: -taxDep,
      explain: "…which is lower in year one because Investment Boost reduces the asset's tax base first.",
    },
    {
      label: "Less: Investment Boost (20% of new assets)",
      amount: -boost,
      explain: "An extra up-front deduction of 20% of the cost of new business assets bought after 22 May 2025.",
    },
  ];
  const taxableIncome = r2(input.profitBeforeTax + items.reduce((s, i) => s + i.amount, 0));
  const taxRounded = Math.max(0, Math.floor(taxableIncome)); // IRD works in whole dollars
  const tax = r2(taxRounded * COMPANY_TAX_RATE);
  const residual = r2(tax - input.rwt);
  const terminal = r2(residual - input.provisional);
  return { items, assets, accountingDep, taxDep, boost, taxableIncome, tax, rwt: input.rwt, provisional: input.provisional, residual, terminal, rate: COMPANY_TAX_RATE };
}
