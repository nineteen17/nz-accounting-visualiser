/**
 * "Work it out" drills (N1–N8): typed answers, with the working shown afterwards.
 * The numbers are generated each time, but every rule and rate comes from the same code the course
 * uses (lib/nz, the café's books), so the answers always match the lessons.
 */
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { EMPLOYEES, FIXED_ASSETS } from "@/data/business";
import { balances } from "@/lib/engine/ledger";
import { balanceSheet, profitAndLoss } from "@/lib/engine/statements";
import { dvDepreciation, monthsOwned, slDepreciation } from "@/lib/nz/assets";
import { calcPay } from "@/lib/nz/payroll";
import { COMPANY_TAX_RATE, HOLIDAYS, KIWISAVER, PROVISIONAL_TAX, RWT, STUDENT_LOAN } from "@/lib/nz/rates";
import { $, $$, int, mc, num, pct, pick, r2, type Drill, type Question, type Rng } from "./core";

/* months of Kōwhai's first income year: 1 April 2026 – 31 March 2027 */
const MONTHS = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
const yearFor = (i: number) => (i < 9 ? 2026 : 2027);
const iso = (i: number, day = 1) => `${yearFor(i)}-${String(((i + 3) % 12) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const monthName = (i: number) => `${MONTHS[i]} ${yearFor(i)}`;

/* ───────────── N1 apportioning ───────────── */

function apportion(rng: Rng): Question {
  const kind = pick(rng, ["prepaid", "prepaid", "expense", "wages", "accrued-income", "in-advance"] as const);
  if (kind === "prepaid" || kind === "expense") {
    const thing = pick(rng, [
      { what: "insurance", n: 12, per: int(rng, 30, 80) * 5 },
      { what: "insurance", n: 6, per: int(rng, 30, 80) * 5 },
      { what: "a software subscription", n: 12, per: int(rng, 4, 16) * 5 },
      { what: "rent", n: 3, per: 3_000 },
    ]);
    const s = int(rng, 12 - thing.n + 1, 11);
    const amount = thing.per * thing.n;
    const now = 12 - s, later = thing.n - now;
    const prompt = `On 1 ${monthName(s)} Kōwhai pays **${$$(amount)}** (before GST) for **${thing.n} months** of ${thing.what}, starting that day. Balance date is 31 March 2027.\n\n` +
      (kind === "prepaid" ? "How much is **prepaid** (an asset) at 31 March 2027?" : "How much is this year's **expense**?");
    const explain = `${thing.n} months cost ${$$(amount)}, so each month is ${$$(thing.per)}. **${now} month${now === 1 ? "" : "s"}** (${MONTHS[s]}–March) belong to this year: ${$(thing.per * now)} of expense. ` +
      `The other **${later} month${later === 1 ? "" : "s"}** belong to next year: ${$(thing.per * later)} is a [[prepayment]], a current asset that becomes next year's expense.`;
    return num(prompt, kind === "prepaid" ? thing.per * later : thing.per * now, explain);
  }
  if (kind === "wages") {
    const fortnight = int(rng, 150, 400) * 10;
    const days = int(rng, 1, 9);
    return num(
      `Kōwhai's staff are paid fortnightly. The fortnight that includes 31 March 2027 has 10 working days and gross wages of **${$$(fortnight)}**; **${days}** of those days fall on or before 31 March. It's paid in April.\n\nHow much are the **accrued wages** at 31 March?`,
      r2((fortnight * days) / 10),
      `The staff have earned ${days} of the 10 days' pay by balance date, but it isn't paid until April: ${$$(fortnight)} × ${days}/10 = **${$(r2((fortnight * days) / 10))}**. Debit wages, credit accrued wages (a liability). It's an [[accrued-expense]].`,
    );
  }
  if (kind === "accrued-income") {
    const ex = int(rng, 10, 80) * 25;
    const inc = r2(ex * 1.15);
    return num(
      `Kōwhai caters a farewell on 29 March 2027 for a quoted **${$(inc)}** including GST. It won't send the invoice until April.\n\nHow much **accrued income** does it record at 31 March (before GST)?`,
      ex,
      `The work is done in March, so the income belongs to this year: ${$(inc)} ÷ 1.15 = **${$(ex)}**. Debit accrued income (an asset), credit catering sales. No GST is recorded yet: on the invoice basis the GST is due once the invoice is issued. It's [[accrued-income]].`,
    );
  }
  const ex = int(rng, 8, 40) * 50;
  const inc = r2(ex * 1.15);
  return num(
    `On 20 March 2027 a couple pays Kōwhai a **${$(inc)}** deposit (including GST) for wedding catering in May.\n\nHow much is recorded as **income in advance** (a liability) at 31 March?`,
    ex,
    `The wedding hasn't happened, so none of it is income yet. The GST is due now, because receiving a payment triggers GST: ${$(inc)} × 3/23 = ${$(r2(inc - ex))}. The rest, **${$(ex)}**, is [[income-in-advance]]: the café owes the couple a service. It becomes income in May.`,
  );
}

/* ───────────── N2 depreciation ───────────── */

function depreciation(rng: Rng): Question {
  const a = pick(rng, FIXED_ASSETS);
  const name = a.name.replace(/ \(.*\)$/, "").toLowerCase();
  const kind = pick(rng, ["dv-part", "dv-part", "sl", "dv-year2", "book-value", "sale"] as const);
  if (kind === "dv-part") {
    const s = int(rng, 0, 11), cost = int(rng, 20, 200) * 100;
    const months = monthsOwned(iso(s, int(rng, 1, 28)));
    const dep = dvDepreciation(cost, a.dvRate, months);
    return num(
      `Kōwhai buys a ${name} for **${$$(cost)}** (before GST) in **${monthName(s)}**. It uses diminishing value at **${pct(a.dvRate, 0)}**.\n\nWhat's the depreciation for the year to 31 March 2027?`,
      dep,
      `IRD counts the month you buy an asset as a whole month, so it's owned for **${months} month${months === 1 ? "" : "s"}** (${MONTHS[s]}–March): ${$$(cost)} × ${pct(a.dvRate, 0)} × ${months}/12 = **${$(dep)}**. See [[diminishing-value]].`,
      { hint: "To the cent, in the year it's bought" },
    );
  }
  if (kind === "sl") {
    const dep = slDepreciation(a.cost, a.slRate);
    return num(
      `Kōwhai's ${name} cost **${$$(a.cost)}**. Using straight line at **${pct(a.slRate, 1).replace(".0", "")}**, what's a full year's depreciation?`,
      dep,
      `Straight line is the rate × the **original cost**, the same every year: ${$$(a.cost)} × ${pct(a.slRate, 1).replace(".0", "")} = **${$(dep)}**. See [[straight-line]].`,
    );
  }
  const y1 = dvDepreciation(a.cost, a.dvRate), bv1 = r2(a.cost - y1), y2 = dvDepreciation(bv1, a.dvRate), bv2 = r2(bv1 - y2);
  if (kind === "dv-year2") {
    return num(
      `Kōwhai's ${name} cost **${$$(a.cost)}** in April 2026, and is depreciated at **${pct(a.dvRate, 0)} diminishing value**. Year 1's depreciation was ${$(y1)}.\n\nWhat's the depreciation in **year 2**?`,
      y2,
      `Diminishing value applies the rate to what's **left**: the book value after year 1 is ${$$(a.cost)} − ${$(y1)} = ${$(bv1)}, and ${$(bv1)} × ${pct(a.dvRate, 0)} = **${$(y2)}**. Taking ${pct(a.dvRate, 0)} of the cost again (${$(y1)}) is the usual mistake.`,
    );
  }
  if (kind === "book-value") {
    return num(
      `Kōwhai's ${name} cost **${$$(a.cost)}** in April 2026, depreciated at **${pct(a.dvRate, 0)} diminishing value** for a full year each year.\n\nWhat's its **book value** at 31 March 2028 (after two years)?`,
      bv2,
      `Year 1: ${$$(a.cost)} × ${pct(a.dvRate, 0)} = ${$(y1)}, leaving ${$(bv1)}. Year 2: ${$(bv1)} × ${pct(a.dvRate, 0)} = ${$(y2)}, leaving **${$(bv2)}**. That's cost − [[accumulated-depreciation]] (${$(r2(y1 + y2))}).`,
    );
  }
  const bv = int(rng, 4, 60) * 50;
  const sale = Math.max(50, bv + pick(rng, [-1, 1]) * int(rng, 1, 12) * 25);
  const gain = sale > bv;
  return num(
    `An old ${name} has a **book value of ${$$(bv)}**. Kōwhai sells it for **${$$(sale)} plus GST**.\n\nHow much is the **${gain ? "gain" : "loss"} on sale**?`,
    Math.abs(sale - bv),
    `Compare the sale price **before GST** with the book value: ${$$(sale)} − ${$$(bv)} = ${gain ? "" : "−"}${$$(Math.abs(sale - bv))}, a **${gain ? "gain" : "loss"}**. The GST (${$(r2(sale * 0.15))}) is IRD's, so it's not part of the ${gain ? "gain" : "loss"}. See [[gain-on-sale]].`,
  );
}

/* ───────────── N3 cost of goods sold ───────────── */

function cogs(rng: Rng): Question {
  const open = int(rng, 250, 550) * 10, buy = int(rng, 1100, 1500) * 100, close = int(rng, 300, 600) * 10, sales = int(rng, 3900, 4900) * 100;
  const c = open + buy - close, gp = sales - c, margin = Math.round((gp / sales) * 1000) / 10;
  const facts = `Opening stock **${$$(open)}**, purchases **${$$(buy)}**, closing stock (from the stocktake) **${$$(close)}**`;
  const kind = pick(rng, ["cogs", "gp", "margin"] as const);
  const working = `Cost of goods sold = opening stock + purchases − closing stock = ${$$(open)} + ${$$(buy)} − ${$$(close)} = **${$$(c)}**.`;
  if (kind === "cogs") return num(`${facts}.\n\nWhat's the [[cost-of-goods-sold|cost of goods sold]]?`, c, `${working} The closing stock hasn't been sold yet, so it's taken off and carried into next year as an asset.`);
  if (kind === "gp") return num(`${facts}. Sales are **${$$(sales)}**.\n\nWhat's the **gross profit**?`, gp, `${working} Gross profit = sales − cost of goods sold = ${$$(sales)} − ${$$(c)} = **${$$(gp)}**.`);
  return num(`${facts}. Sales are **${$$(sales)}**.\n\nWhat's the **gross margin**, as a percentage to one decimal place?`, margin,
    `${working} Gross profit is ${$$(sales)} − ${$$(c)} = ${$$(gp)}, and ${$$(gp)} ÷ ${$$(sales)} = **${margin}%**. Cafés usually aim for 65–72%.`, { unit: "%", hint: "One decimal place, e.g. 70.3" });
}

/* ───────────── N4 payroll ───────────── */

function payroll(rng: Rng): Question {
  const e = pick(rng, EMPLOYEES);
  const hours = int(rng, 40, 80) + (rng() < 0.3 ? 0.5 : 0);
  const p = calcPay(e, hours);
  const first = e.name.split(" ")[0];
  const who = `${first} (${e.casual ? "casual, paid 8% holiday pay with every pay" : "permanent"}, ${$(e.rate)} an hour, tax code ${e.code}${e.studentLoan ? " SL" : ""}, KiwiSaver ${pct(KIWISAVER.employeeDefault)})`;
  const base = `${who} works **${hours} hours** this fortnight.`;
  const grossWhy = e.casual
    ? `${hours} × ${$(e.rate)} = ${$(p.ordinary)}, plus 8% holiday pay ${$(p.holidayPay)} = **${$(p.gross)}** gross.`
    : `${hours} × ${$(e.rate)} = **${$(p.gross)}** gross.`;
  const kinds = ["gross", "ks", "employer-ks", "net", "cost", ...(e.studentLoan ? ["sl"] : []), "esct"] as const;
  const kind = pick(rng, kinds);
  if (kind === "gross") return num(`${base}\n\nWhat's ${first}'s [[gross-pay|gross pay]]?`, p.gross, grossWhy + (e.casual ? " Casuals get their holiday pay as they go, so nothing is accrued for them." : ""));
  if (kind === "ks") return num(`${base} Gross pay is ${$(p.gross)}.\n\nHow much **KiwiSaver** is deducted from ${first}'s pay?`, p.ksEmployee,
    `The employee's contribution is ${pct(KIWISAVER.employeeDefault)} of **gross** pay: ${$(p.gross)} × ${pct(KIWISAVER.employeeDefault)} = **${$(p.ksEmployee)}**, deducted from their pay.`);
  if (kind === "employer-ks") return num(`${base} Gross pay is ${$(p.gross)}.\n\nWhat's Kōwhai's **employer KiwiSaver contribution** before ESCT?`, p.ksEmployerGross,
    `At least ${pct(KIWISAVER.employerMinimum)} of gross pay, paid **on top of** wages: ${$(p.gross)} × ${pct(KIWISAVER.employerMinimum)} = **${$(p.ksEmployerGross)}**. It isn't taken out of ${first}'s pay. See [[employer-kiwisaver]].`);
  if (kind === "esct") return num(`Kōwhai's employer KiwiSaver contribution for ${first} this fortnight is **${$(p.ksEmployerGross)}**. ${first}'s ESCT rate is **${pct(p.esctRate)}**.\n\nHow much **ESCT** is deducted from the contribution? (IRD's rule: drop the cents from the contribution first, then cut the answer to whole cents.)`, p.esct,
    `Drop the cents from the contribution, then apply the rate (IRD's rule): ${$(Math.floor(p.ksEmployerGross + 1e-6))} × ${pct(p.esctRate)} = **${$(p.esct)}**, cut to whole cents. ESCT is tax on the employer's contribution; it's paid to IRD with the PAYE, and the other ${$(p.ksEmployerNet)} goes into ${first}'s KiwiSaver. See [[esct|ESCT]].`);
  if (kind === "sl") return num(`${base} Gross pay is ${$(p.gross)}.\n\nHow much **student loan** is deducted? (12% of pay over ${$(STUDENT_LOAN.fortnightlyThreshold)} a fortnight, with the cents dropped from the pay first)`, p.studentLoan,
    `Drop the cents from the gross pay first (IRD's rule): (${$(Math.floor(p.gross + 1e-6))} − ${$(STUDENT_LOAN.fortnightlyThreshold)}) × 12% = **${$(p.studentLoan)}**. Only pay **above** the threshold counts.`);
  if (kind === "cost") return num(`${base} Gross pay is ${$(p.gross)}.\n\nWhat does this pay **cost Kōwhai** in total (gross pay plus employer KiwiSaver)?`, p.employerCost,
    `${$(p.gross)} + ${pct(KIWISAVER.employerMinimum)} employer KiwiSaver ${$(p.ksEmployerGross)} = **${$(p.employerCost)}**. PAYE and the employee's KiwiSaver come **out of** gross pay, so they don't add to the cost.`);
  const deductions = [`PAYE ${$(p.paye)}`, ...(p.studentLoan ? [`student loan ${$(p.studentLoan)}`] : []), `KiwiSaver ${$(p.ksEmployee)}`];
  return num(`${base} Gross pay is ${$(p.gross)}. PAYE (including the ACC earners' levy) is **${$(p.paye)}**${p.studentLoan ? ` and student loan is **${$(p.studentLoan)}**` : ""}.\n\nWhat's ${first}'s [[net-pay|net (take-home) pay]]?`, p.net,
    `Gross pay less every deduction: ${$(p.gross)} − ${deductions.join(" − ")} = **${$(p.net)}**. Don't take off the employer's KiwiSaver: it's paid on top.`);
}

/* ───────────── N5 holiday pay ───────────── */

function holidayPay(rng: Rng): Question {
  const kind = pick(rng, ["payg", "public", "leave"] as const);
  if (kind === "payg") {
    const leo = EMPLOYEES.find((e) => e.casual)!;
    const hours = int(rng, 8, 60);
    const ordinary = r2(hours * leo.rate), hp = r2(ordinary * HOLIDAYS.payAsYouGoRate);
    return num(`${leo.name.split(" ")[0]} is a casual on **${$(leo.rate)} an hour**, paid holiday pay as he goes. He works **${hours} hours** this fortnight.\n\nHow much **holiday pay** is added to this pay?`, hp,
      `8% of his ordinary pay: ${hours} × ${$(leo.rate)} = ${$(ordinary)}, × 8% = **${$(hp)}**. It must show separately on his payslip, and it's only allowed for casual or short fixed-term staff. See [[pay-as-you-go]].`);
  }
  if (kind === "public") {
    const rate = pick(rng, [24.5, 25.5, 26, 27]), hours = int(rng, 4, 9);
    const pay = r2(hours * rate * 1.5);
    return num(`A barista on **${$(rate)} an hour** works **${hours} hours** on Matariki, which would otherwise be one of their working days.\n\nHow much are they paid for those hours?`, pay,
      `At least **time and a half**: ${hours} × ${$(rate)} × 1.5 = **${$(pay)}**. They also get an **alternative holiday**: a paid day off to take later. See [[public-holidays]].`);
  }
  const rate = pick(rng, [26, 27]), owp = r2(rate * 40), awe = r2(owp + int(rng, -12, 14) * 10), weeks = int(rng, 1, 3);
  const pay = r2(Math.max(owp, awe) * weeks);
  return num(`Mia takes **${weeks} week${weeks === 1 ? "" : "s"}** of annual leave. Her ordinary weekly pay is **${$(owp)}** (40 hours at ${$(rate)}). Her average weekly earnings over the last 12 months are **${$(awe)}**.\n\nHow much annual leave pay does she get?`, pay,
    `Annual leave is paid at the **greater** of ordinary weekly pay and average weekly earnings: ${$(Math.max(owp, awe))} × ${weeks} = **${$(pay)}**. It comes out of the [[holiday-pay]] accrual, not as a new expense. See [[annual-leave]].`);
}

/* ───────────── N6 taxable income ───────────── */

function taxableIncome(rng: Rng): Question {
  const pbt = int(rng, 400, 1200) * 100 + int(rng, 0, 99);
  const ent = int(rng, 30, 160) * 10, hol = rng() < 0.5 ? 0 : int(rng, 150, 500) * 10;
  const accDep = int(rng, 80, 160) * 100, taxDep = int(rng, 60, 180) * 100;
  const ti = r2(pbt + ent / 2 + hol + accDep - taxDep);
  const facts = [`profit before tax **${$$(pbt)}**`, `food & drink entertainment **${$$(ent)}** (50% deductible)`, ...(hol ? [`holiday pay accrued but not paid within 63 days **${$$(hol)}**`] : []), `accounting depreciation **${$$(accDep)}**`, `tax depreciation **${$$(taxDep)}**`];
  const working = `${$$(pbt)} + ${$(ent / 2)} (half the entertainment)${hol ? ` + ${$$(hol)} (holiday pay, deductible when paid)` : ""} + ${$$(accDep)} (accounting depreciation) − ${$$(taxDep)} (tax depreciation) = **${$(ti)}**`;
  if (rng() < 0.55) {
    return num(`A café company's year: ${facts.join(", ")}.\n\nWhat's its [[taxable-income|taxable income]]?`, ti,
      `Start with accounting profit and make the tax adjustments: ${working}. Accounting depreciation is swapped for the tax figure.`);
  }
  const tax = r2(Math.floor(ti) * COMPANY_TAX_RATE);
  return num(`A company's taxable income is **${$(ti)}**. How much **income tax** is that at the company rate?`, tax,
    `IRD works in whole dollars: ${$$(Math.floor(ti))} × 28% = **${$(tax)}**. This is the tax on the IR4, before credits like RWT and provisional tax already paid.`);
}

/* ───────────── N7 provisional tax ───────────── */

function provisional(rng: Rng): Question {
  const kind = pick(rng, ["rit", "standard", "instalment", "terminal", "threshold"] as const);
  const rit = int(rng, 30, 400) * 100 + int(rng, 0, 99) + int(rng, 0, 99) / 100;
  if (kind === "rit") {
    const rwt = r2(int(rng, 20, 600) + int(rng, 0, 99) / 100), tax = r2(rit + rwt);
    return num(`Kōwhai's income tax for the year is **${$(tax)}**. The bank deducted **${$(rwt)}** of RWT from its interest.\n\nWhat's its [[residual-income-tax|residual income tax]] (**RIT**)?`, r2(tax - rwt),
      `RIT = tax − tax credits: ${$(tax)} − ${$(rwt)} = **${$(r2(tax - rwt))}**. RIT over ${$$(PROVISIONAL_TAX.ritThreshold)} means provisional tax next year.`);
  }
  const total = r2(rit * (1 + PROVISIONAL_TAX.standardUplift));
  if (kind === "standard") return num(`Kōwhai's RIT last year was **${$(rit)}**. Using the **standard method**, how much provisional tax does it pay this year in total?`, total,
    `Last year's RIT + 5%: ${$(rit)} × 1.05 = **${$(total)}**, paid in three instalments (${PROVISIONAL_TAX.instalments.join(", ")}).`);
  if (kind === "instalment") return num(`Kōwhai's provisional tax for the year is **${$(total)}** (standard method). How much is the **first instalment** on 28 August?`, r2(total / 3),
    `A third each time: ${$(total)} ÷ 3 = **${$(r2(total / 3))}**, due ${PROVISIONAL_TAX.instalments.join(", ")}.`);
  if (kind === "terminal") {
    const paid = r2(rit * pick(rng, [0.7, 0.8, 0.85, 0.9]));
    return num(`This year Kōwhai's RIT is **${$(rit)}**. It paid **${$(paid)}** of provisional tax during the year.\n\nHow much [[terminal-tax|terminal tax]] is left to pay?`, r2(rit - paid),
      `${$(rit)} − ${$(paid)} = **${$(r2(rit - paid))}**, due 7 February after the year ends, or 7 April with a tax agent.`);
  }
  const small = rng() < 0.5 ? int(rng, 5, 49) * 100 : int(rng, 51, 120) * 100;
  const yes = small > PROVISIONAL_TAX.ritThreshold;
  return mc(rng, yes ? "Yes" : "No", ["Yes", "No"], `A company's RIT is **${$$(small)}** this year. Does it have to pay [[provisional-tax|provisional tax]] next year?`,
    `${yes ? "**Yes**" : "**No**"}: provisional tax applies when RIT is **over ${$$(PROVISIONAL_TAX.ritThreshold)}**. ${yes ? "Next year's tax is paid in advance, in instalments." : "It pays the whole year's tax as terminal tax instead."}`);
}

/* ───────────── N8 ratios (Kōwhai's real statements) ───────────── */

const YEARS = [
  { label: "31 March 2027 (year 1)", b: balances(Y1.BEFORE_CLOSING), loan: 12 },
  { label: "31 March 2028 (year 2)", b: balances([Y2.OPENING_ENTRY, ...Y2.BEFORE_CLOSING]), loan: 24 },
].map((y) => {
  const pl = profitAndLoss(y.b), bs = balanceSheet(y.b, { splitLoan: true, loanMonthIndex: y.loan });
  const stock = y.b["130"] ?? 0, prepaid = (y.b["135"] ?? 0) + (y.b["136"] ?? 0);
  return { label: y.label, pl, bs, stock, prepaid };
});

function ratios(rng: Rng): Question {
  const y = pick(rng, YEARS);
  const ca = y.bs.currentAssetsTotal, cl = y.bs.currentLiabilitiesTotal;
  const kind = pick(rng, ["current", "quick", "wc", "gm", "nm", "de"] as const);
  const at = `Kōwhai at **${y.label}**`;
  if (kind === "current") return num(`${at}: current assets **${$(ca)}**, current liabilities **${$(cl)}**.\n\nWhat's the [[current-ratio|current ratio]]? (to 2 decimal places)`, r2(ca / cl),
    `${$(ca)} ÷ ${$(cl)} = **${(ca / cl).toFixed(2)}**. Above about 1.5 is comfortable.`, { unit: "", tolerance: 0.01, hint: "Two decimal places, e.g. 1.85" });
  if (kind === "quick") {
    const q = ca - y.stock - y.prepaid;
    return num(`${at}: current assets **${$(ca)}**, including stock **${$(y.stock)}** and prepayments **${$(y.prepaid)}**. Current liabilities **${$(cl)}**.\n\nWhat's the [[quick-ratio|quick ratio]]? (to 2 decimal places)`, r2(q / cl),
      `Leave out what can't quickly become cash: (${$(ca)} − ${$(y.stock)} − ${$(y.prepaid)}) ÷ ${$(cl)} = ${$(q)} ÷ ${$(cl)} = **${(q / cl).toFixed(2)}**.`, { unit: "", tolerance: 0.01, hint: "Two decimal places" });
  }
  if (kind === "wc") return num(`${at}: current assets **${$(ca)}**, current liabilities **${$(cl)}**.\n\nWhat's the [[working-capital|working capital]]?`, r2(ca - cl), `${$(ca)} − ${$(cl)} = **${$(r2(ca - cl))}**.`);
  if (kind === "gm") {
    const m = Math.round(y.pl.grossMargin * 1000) / 10;
    return num(`${at}: revenue **${$(y.pl.revenueTotal)}**, gross profit **${$(y.pl.grossProfit)}**.\n\nWhat's the [[gross-margin|gross margin]]? (as a %, one decimal place)`, m,
      `${$(y.pl.grossProfit)} ÷ ${$(y.pl.revenueTotal)} = **${m}%**.`, { unit: "%", hint: "One decimal place" });
  }
  if (kind === "nm") {
    const m = Math.round((y.pl.profitAfterTax / y.pl.revenueTotal) * 1000) / 10;
    return num(`${at}: revenue **${$(y.pl.revenueTotal)}**, profit after tax **${$(y.pl.profitAfterTax)}**.\n\nWhat's the **net profit margin**? (as a %, one decimal place)`, m,
      `${$(y.pl.profitAfterTax)} ÷ ${$(y.pl.revenueTotal)} = **${m}%**: about ${Math.round(m)} cents of profit from each dollar of sales.`, { unit: "%", hint: "One decimal place" });
  }
  return num(`${at}: total liabilities **${$(y.bs.totalLiabilities)}**, total equity **${$(y.bs.equityTotal)}**.\n\nWhat's the **debt-to-equity ratio**? (to 2 decimal places)`, r2(y.bs.totalLiabilities / y.bs.equityTotal),
    `${$(y.bs.totalLiabilities)} ÷ ${$(y.bs.equityTotal)} = **${(y.bs.totalLiabilities / y.bs.equityTotal).toFixed(2)}**: lenders and suppliers fund ${(y.bs.totalLiabilities / y.bs.equityTotal).toFixed(2)} dollars for every dollar of the owners'. Banks like it under 2.`, { unit: "", tolerance: 0.01, hint: "Two decimal places" });
}

/* ───────────── N9 balance a T-account ───────────── */

const T_ACCOUNTS = [
  { name: "Bank – cheque account", normal: "debit", dr: ["card sales settled", "cash takings banked", "a customer pays an invoice"], cr: ["rent paid", "suppliers paid", "wages paid", "loan repayment"] },
  { name: "Accounts payable (creditors)", normal: "credit", dr: ["paid Southern Roasters", "paid Valley Dairy", "paid Fresh Fields"], cr: ["beans bought on credit", "milk bought on credit", "food bought on credit", "power bill received"] },
  { name: "Accounts receivable (debtors)", normal: "debit", dr: ["catering invoice to Tūī Consulting", "catering invoice to Harbour Law", "catering invoice to the school"], cr: ["Tūī Consulting pays", "Harbour Law pays", "the school pays"] },
] as const;

function tAccount(rng: Rng): Question {
  const acc = pick(rng, T_ACCOUNTS);
  const sign = acc.normal === "debit" ? 1 : -1;
  for (;;) {
    const opening = int(rng, 20, 120) * 50;
    const moves: { side: "debit" | "credit"; what: string; amt: number }[] = [];
    const n = int(rng, 3, 5);
    for (let i = 0; i < n; i++) {
      const side = rng() < 0.5 ? "debit" : "credit";
      moves.push({ side, what: pick(rng, side === "debit" ? acc.dr : acc.cr), amt: int(rng, 4, 80) * 25 });
    }
    let bal = opening * sign;
    for (const m of moves) bal += m.side === "debit" ? m.amt : -m.amt;
    if (bal * sign <= 0) continue; // keep it on its normal side
    const dr = moves.filter((m) => m.side === "debit").reduce((x, m) => x + m.amt, 0) + (acc.normal === "debit" ? opening : 0);
    const cr = moves.filter((m) => m.side === "credit").reduce((x, m) => x + m.amt, 0) + (acc.normal === "credit" ? opening : 0);
    const list = moves.map((m) => `- ${m.side === "debit" ? "Debit" : "Credit"} ${$$(m.amt)}: ${m.what}`).join("\n");
    const answer = Math.abs(bal);
    return num(`**${acc.name}** starts the month with a **${acc.normal}** balance of **${$$(opening)}**. Then:\n\n${list}\n\nWhat's the closing balance? (It's still a ${acc.normal} balance.)`, answer,
      `Debits total ${$$(dr)} and credits total ${$$(cr)} (the opening balance counts on the ${acc.normal} side). The difference is **${$$(answer)}**, on the ${acc.normal} side. See [[t-account|T-accounts]].`,
      { hint: "Add up each side, then take the smaller from the bigger" });
  }
}

/* ───────────── N10 cash basis vs accrual basis ───────────── */

function cashVsAccrual(rng: Rng): Question {
  const cashSales = int(rng, 200, 400) * 100, invoiced = int(rng, 10, 40) * 50, received = int(rng, 10, 40) * 50;
  const foodUsed = int(rng, 60, 120) * 50, paidOld = int(rng, 50, 110) * 50, rent = 3_000;
  const accrual = cashSales + invoiced - foodUsed - rent;
  const cash = cashSales + received - paidOld - rent;
  const facts = [
    `Cash and card sales over the counter: **${$$(cashSales)}**`,
    `A catering job done and invoiced this month, to be paid next month: **${$$(invoiced)}**`,
    `A customer pays for last month's catering: **${$$(received)}**`,
    `Food used this month, bought on credit and not paid yet: **${$$(foodUsed)}**`,
    `Last month's food bill paid: **${$$(paidOld)}**`,
    `This month's rent, paid: **${$$(rent)}**`,
  ].map((f) => `- ${f}`).join("\n");
  const accrualQ = rng() < 0.5;
  return num(`One month at Kōwhai (all amounts before GST):\n\n${facts}\n\nWhat's the month's profit on the **${accrualQ ? "accrual" : "cash"} basis**?`, accrualQ ? accrual : cash,
    accrualQ
      ? `The accrual basis counts what was **earned and used** this month, whenever the cash moves: ${$$(cashSales)} + ${$$(invoiced)} − ${$$(foodUsed)} − ${$$(rent)} = **${$$(accrual)}**. Last month's invoice and bill belong to last month. See [[accrual-basis]].`
      : `The cash basis only counts **money in and out** this month: ${$$(cashSales)} + ${$$(received)} − ${$$(paidOld)} − ${$$(rent)} = **${$$(cash)}**. The new invoice and the unpaid food bill don't count yet. See [[cash-basis]].`,
    { hint: "Whole dollars" });
}

/* ───────────── N11 GST payable for a period ───────────── */

function gstReturn(rng: Rng): Question {
  const sales = int(rng, 500, 900) * 100, purchases = int(rng, 120, 400) * 100, fees = int(rng, 20, 60) * 10, wages = int(rng, 150, 300) * 100;
  const output = r2((sales * 3) / 23), input = r2((purchases * 3) / 23), pay = r2(output - input);
  return num(`Kōwhai's two-monthly GST period (amounts **include GST** where GST applies):\n\n- Sales: **${$$(sales)}**\n- Purchases with tax invoices: **${$$(purchases)}**\n- Bank and merchant fees: **${$$(fees)}** (exempt)\n- Wages: **${$$(wages)}**\n\nHow much GST does Kōwhai pay IRD for the period?`, pay,
    `Output tax ${$$(sales)} × 3/23 = ${$(output)}; input tax ${$$(purchases)} × 3/23 = ${$(input)}. GST to pay = ${$(output)} − ${$(input)} = **${$(pay)}**. Fees are exempt and wages aren't a supply, so neither has GST to claim. See [[gst-return]].`);
}

/* ───────────── N12 dividends and imputation ───────────── */

function imputation(rng: Rng): Question {
  const cash = int(rng, 5, 60) * 1_000;
  const ic = r2((cash * COMPANY_TAX_RATE) / (1 - COMPANY_TAX_RATE));
  const gross = r2(cash + ic), rwt = r2(gross * RWT.dividendRate - ic);
  const kind = pick(rng, ["ic", "gross", "rwt", "net"] as const);
  const base = `Kōwhai pays a fully imputed dividend of **${$$(cash)}**.`;
  if (kind === "ic") return num(`${base}\n\nHow much [[imputation-credit|imputation credit]] is attached? (Company tax is 28%.)`, ic,
    `Fully imputed means the full 28% company tax already paid comes with it: ${$$(cash)} × 28/72 = **${$(ic)}**. (28/72, because the cash dividend is the 72% left after tax.)`);
  if (kind === "gross") return num(`${base}\n\nWhat's the **gross dividend** (cash plus imputation credits)?`, gross,
    `Imputation credits are ${$$(cash)} × 28/72 = ${$(ic)}, so the gross dividend is ${$$(cash)} + ${$(ic)} = **${$(gross)}**: the profit before company tax.`);
  if (kind === "rwt") return num(`${base} Imputation credits of **${$(ic)}** are attached.\n\nHow much **dividend RWT** must Kōwhai deduct? (33% of the gross dividend, less the imputation credits)`, rwt,
    `(${$$(cash)} + ${$(ic)}) × 33% = ${$(r2(gross * RWT.dividendRate))}, less the imputation credits ${$(ic)} = **${$(rwt)}**. It covers the gap between company tax (28%) and the 33% RWT rate.`);
  return num(`${base} Imputation credits are **${$(ic)}** and dividend RWT is **${$(rwt)}**.\n\nHow much cash do the shareholders receive in total?`, r2(cash - rwt),
    `The dividend less the RWT, which Kōwhai pays to IRD for them: ${$$(cash)} − ${$(rwt)} = **${$(r2(cash - rwt))}**. Imputation credits aren't cash; they're tax already paid, which the shareholders claim on their own returns.`);
}

export const CALC_DRILLS: Drill[] = [
  { key: "apportion", group: "calculate", part: 2, title: "Accruals & prepayments", icon: "✂️", blurb: "Split a cost or income between this year and next: prepayments, accrued wages, accrued income, deposits.", learn: { href: "/cycle/adjustments", label: "Step 7 · Adjusting entries" }, make: apportion },
  { key: "depreciation", group: "calculate", part: 3, title: "Depreciation", icon: "📉", blurb: "Diminishing value and straight line, part years, book value, and gain or loss on sale.", learn: { href: "/nz/depreciation", label: "Depreciation" }, make: depreciation },
  { key: "cogs", group: "calculate", part: 2, title: "Cost of goods sold", icon: "📦", blurb: "Opening stock + purchases − closing stock, then gross profit and margin.", learn: { href: "/nz/inventory", label: "Inventory" }, make: cogs },
  { key: "payroll", group: "calculate", part: 3, title: "Payroll", icon: "💵", blurb: "Mia's and Leo's pay: gross, KiwiSaver, ESCT, student loan, net pay and the employer's cost.", learn: { href: "/nz/paye", label: "PAYE" }, make: payroll },
  { key: "holiday-pay", group: "calculate", part: 3, title: "Holiday pay", icon: "🏖️", blurb: "8% pay-as-you-go, working a public holiday, and annual leave pay.", learn: { href: "/nz/holidays", label: "Holidays" }, make: holidayPay },
  { key: "taxable-income", group: "calculate", part: 3, title: "Taxable income & tax", icon: "🏛️", blurb: "From accounting profit to taxable income, then tax at 28%.", learn: { href: "/nz/income-tax", label: "Income tax" }, make: taxableIncome },
  { key: "provisional", group: "calculate", part: 3, title: "Provisional tax", icon: "⏱️", blurb: "RIT, the standard method, instalments and terminal tax.", learn: { href: "/nz/provisional-tax", label: "Provisional tax" }, make: provisional },
  { key: "t-account", group: "calculate", part: 1, title: "Balance a T-account", icon: "📒", blurb: "Add up the debits and credits and find the closing balance.", learn: { href: "/foundations/t-accounts", label: "T-accounts" }, make: tAccount },
  { key: "cash-accrual", group: "calculate", part: 1, title: "Cash vs accrual profit", icon: "🔀", blurb: "The same month's profit on a cash basis and on an accrual basis.", learn: { href: "/foundations/cash-vs-accrual", label: "Cash vs accrual" }, make: cashVsAccrual },
  { key: "gst-return", group: "calculate", part: 3, title: "GST for a period", icon: "🧮", blurb: "Output tax minus input tax, leaving out what has no GST.", learn: { href: "/nz/gst-return", label: "The GST return" }, make: gstReturn },
  { key: "imputation", group: "calculate", part: 4, title: "Dividends & imputation", icon: "🪙", blurb: "Imputation credits (28/72), the gross dividend, dividend RWT and the cash paid.", learn: { href: "/nz/shareholders", label: "Shareholders" }, make: imputation },
  { key: "ratios", group: "calculate", part: 2, title: "Ratios", icon: "📐", blurb: "Current, quick, working capital, margins and debt to equity, from Kōwhai's real statements.", learn: { href: "/explore/ratios", label: "Explore · Ratios" }, make: ratios },
];
