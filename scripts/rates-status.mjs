// `npm run rates`: which income year the course teaches, what's still carried forward
// and unconfirmed, and where to check each figure. See README: "Updating the rates".
//
// `--warn-only` (used after each build) prints nothing unless the rates are out of date,
// and never fails the build.
import * as R from "../lib/nz/rates.ts";

const warnOnly = process.argv.includes("--warn-only");
const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const outOfDate = R.ratesOutOfDate(today);

if (warnOnly) {
  if (outOfDate) console.warn(`
⚠  Rates: the course still teaches ${R.CURRENT_PAYROLL.year}, but new rates apply from ${R.NEXT_RATES_FROM}. Run \`npm run rates\` and see README "Updating the rates".
`);
} else {
  report();
}

function report() {
const years = Object.entries(R).filter(([k, v]) => k.startsWith("PAYROLL_") && v && typeof v === "object" && "year" in v).map(([k, v]) => ({ name: k, ...v }));
const pct = (x) => `${+(x * 100).toFixed(2)}%`;

console.log(`\nKōwhai Café rates (lib/nz/rates.ts), checked ${R.RATES_AS_AT}\n`);
console.log(`The course teaches: ${R.CURRENT_PAYROLL.year}   (CURRENT_PAYROLL)`);
console.log(`Next year's rates apply from: ${R.NEXT_RATES_FROM}   ${outOfDate ? "← that date has passed: time to update" : "(not yet)"}\n`);
for (const y of years) {
  const current = y.year === R.CURRENT_PAYROLL.year ? "  ← taught now" : "";
  console.log(`${y.name} (${y.year})${current}`);
  console.log(`  ACC earners' levy ${pct(y.acc.rate)} up to $${y.acc.maxLiableEarnings.toLocaleString("en-NZ")} · KiwiSaver ${pct(y.kiwiSaver.employerMinimum)} · student loan over $${y.studentLoan.annualThreshold.toLocaleString("en-NZ")}`);
  console.log(y.toConfirm.length ? `  Still to confirm: ${y.toConfirm.join(", ")}` : "  All confirmed");
}
console.log(`\nMinimum wage: $${R.MINIMUM_WAGE.adult.toFixed(2)} adult, from ${R.MINIMUM_WAGE.from}`);
console.log(`UOMI: ${pct(R.PROVISIONAL_TAX.uomiUnderpaid)} underpaid / ${pct(R.PROVISIONAL_TAX.uomiOverpaid)} overpaid, from ${R.PROVISIONAL_TAX.uomiFrom}`);
console.log(`
Where to check:
  Tax brackets, IETC, ESCT, student loan   https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals
  ACC earners' levy                        ${R.ACC_EARNERS_LEVY.source}
  KiwiSaver                                ${R.KIWISAVER.source}
  Minimum wage                             ${R.MINIMUM_WAGE.source}
  Provisional tax and UOMI                 ${R.PROVISIONAL_TAX.source}
  Depreciation, low-value assets           ${R.DEPRECIATION.source}
`);
}
