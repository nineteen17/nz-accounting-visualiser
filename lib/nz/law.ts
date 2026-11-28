/**
 * "The law" behind each NZ topic: the Acts and sections a rule comes from, with a plain-English
 * summary of what each section says. Every entry was read from the Act on legislation.govt.nz
 * (the official site), at the version shown in ACTS. Figures still come from IRD, ACC and
 * Employment NZ (rates.ts); these references are for the law's wording.
 *
 * How to check or update: docs/LAW-LOOKUP.md.
 */

import { KIWISAVER } from "./rates";

export const LAW_CHECKED = "29 November 2026";

/** rates that change by law each year come from rates.ts, so an April update needs only that file */
const pc = (x: number) => `${+(x * 100).toFixed(2)}%`;

export const ACTS = {
  gst: { name: "Goods and Services Tax Act 1985", year: 1985, no: 141, versionAsAt: "30 June 2026" },
  ita: { name: "Income Tax Act 2007", year: 2007, no: 97, versionAsAt: "4 September 2026" },
  taa: { name: "Tax Administration Act 1994", year: 1994, no: 166, versionAsAt: "1 October 2026" },
  kiwisaver: { name: "KiwiSaver Act 2006", year: 2006, no: 40, versionAsAt: "1 April 2026" },
  holidays: { name: "Holidays Act 2003", year: 2003, no: 129, versionAsAt: "20 December 2023" },
  era: { name: "Employment Relations Act 2000", year: 2000, no: 24, versionAsAt: "10 July 2026" },
  minwage: { name: "Minimum Wage Act 1983", year: 1983, no: 115, versionAsAt: "20 December 2023" },
  acc: { name: "Accident Compensation Act 2001", year: 2001, no: 49, versionAsAt: "10 July 2026" },
  companies: { name: "Companies Act 1993", year: 1993, no: 105, versionAsAt: "1 July 2025" },
  partnership: { name: "Partnership Law Act 2019", year: 2019, no: 53, versionAsAt: "2 November 2026" },
  // secondary legislation (an Order in Council): numbered in clauses, and never amended, so its only version is "as made"
  fso: { name: "Tax Administration (Financial Statements) Order 2014", year: 2014, no: 69, versionAsAt: "as made", kind: "regulation" },
} as const;

const isRegulation = (a: ActKey) => "kind" in ACTS[a] && ACTS[a].kind === "regulation";

/** "Companies Act 1993 as at 1 July 2025", or "… Order 2014 (as made)" */
export const actVersion = (a: ActKey) => isRegulation(a) ? `${ACTS[a].name} (${ACTS[a].versionAsAt})` : `${ACTS[a].name} as at ${ACTS[a].versionAsAt}`;

export type ActKey = keyof typeof ACTS;

export type LawRef = {
  act: ActKey;
  /** section number as the Act prints it, e.g. "8" or "EB 23" */
  section: string;
  /** the section's heading, as in the Act */
  heading: string;
  /** the section's anchor on legislation.govt.nz */
  anchor: string;
  /** what it says, in plain English */
  says: string;
};

/** official link to the section (the whole Act opens, scrolled to the section) */
export function lawUrl(ref: LawRef) {
  const a = ACTS[ref.act];
  const path = isRegulation(ref.act) ? "secondary-legislation/pco-drafted" : "act/public";
  return `https://www.legislation.govt.nz/${path}/${a.year}/${a.no}/en/latest/#${ref.anchor}`;
}

/** "s 8" for numbered sections (Income Tax Act sections already carry letters: "s EB 23"); "cl 8" in a regulation; a schedule is just "Schedule" */
export const sectionLabel = (ref: LawRef) => ref.section.startsWith("Schedule") ? ref.section : `${isRegulation(ref.act) ? "cl" : "s"} ${ref.section}`;

export const LAW: Record<string, LawRef[]> = {
  gst: [
    { act: "gst", section: "8", heading: "Imposition of goods and services tax on supply", anchor: "DLM82299",
      says: "GST is charged at 15% on goods and services supplied in New Zealand by a registered person, in the course of their taxable activity." },
    { act: "gst", section: "51", heading: "Persons making supplies in course of taxable activity to be registered", anchor: "DLM84824",
      says: "You must register at the end of any month when your supplies for that month and the 11 before it have gone over $60,000 (unless IRD accepts the next 12 months won't)." },
    { act: "gst", section: "11", heading: "Zero-rating of goods", anchor: "DLM82734",
      says: "Exported goods are charged GST at 0% (zero-rated)." },
    { act: "gst", section: "14", heading: "Exempt supplies", anchor: "DLM83078",
      says: "Some supplies carry no GST at all, such as financial services and renting out a home." },
    { act: "gst", section: "19", heading: "Accounting basis", anchor: "DLM83446",
      says: "The invoice basis is the default. IRD can let a business use the payments or hybrid basis instead." },
    { act: "gst", section: "19A", heading: "Requirements for accounting on payments basis", anchor: "DLM83449",
      says: "The payments basis is only allowed if taxable supplies over the last 12 months haven't gone over $2,000,000." },
    { act: "gst", section: "19K", heading: "Taxable supply information: supplies by registered person", anchor: "LMS849294",
      says: "A registered supplier must give the buyer taxable supply information within 28 days of being asked." },
    { act: "gst", section: "9", heading: "Time of supply", anchor: "DLM82419",
      says: "GST is due at the earlier of the invoice being issued and payment being received." },
  ],
  "gst-return": [
    { act: "gst", section: "15", heading: "Taxable periods", anchor: "DLM83096",
      says: "A GST period is 1, 2 or 6 months. Six-monthly is only on application, with taxable supplies of no more than $500,000 a year." },
    { act: "gst", section: "16", heading: "Taxable period returns", anchor: "DLM83422",
      says: "The return is due on the 28th of the month after the period ends, except 15 January (for a period ending in November) and 7 May (for one ending in March)." },
    { act: "gst", section: "20", heading: "Calculation of tax payable", anchor: "DLM83479",
      says: "How the amount for each period is worked out: GST on sales, less the GST you can claim on purchases, plus or minus adjustments." },
    { act: "gst", section: "26", heading: "Bad debts", anchor: "DLM84318",
      says: "If you write off a debt you've already paid GST on, you claim back the GST share of the amount written off." },
    { act: "gst", section: "6", heading: "Meaning of term taxable activity", anchor: "DLM82290",
      says: "A taxable activity doesn't include work as an employee under a contract of service (s 6(3)(b)), so wages carry no GST." },
  ],
  paye: [
    { act: "ita", section: "RD 3", heading: "PAYE income payments", anchor: "DLM1519941",
      says: "The PAYE rules apply to salary or wages, extra pays (like bonuses) and schedular payments." },
    { act: "ita", section: "RD 5", heading: "Salary or wages", anchor: "DLM1519947",
      says: "Salary or wages include allowances, bonuses, commission, overtime and other pay of any kind." },
    { act: "ita", section: "RD 10", heading: "Amounts of tax for PAYE income payments", anchor: "DLM1519961",
      says: "The PAYE to take off each payment is set by schedule 2 of the Act (the basic PAYE rates)." },
    { act: "taa", section: "24B", heading: "PAYE tax codes", anchor: "DLM1252632",
      says: "What a tax code is: the code the employee gives their employer (or IRD provides), which sets how PAYE is worked out." },
    { act: "taa", section: "23E", heading: "Online group of employers", anchor: "LMS191839",
      says: "Employers who file online must send each payday's employment information to IRD within 2 working days after payday." },
    { act: "ita", section: "RD 4", heading: "Payment of amounts of tax to Commissioner", anchor: "DLM1519944",
      says: "An employer who withheld less than $500,000 of PAYE in the previous tax year pays it to IRD by the 20th of the following month; larger employers pay twice a month." },
  ],
  kiwisaver: [
    { act: "kiwisaver", section: "64", heading: "Contribution rate", anchor: "DLM379037",
      says: `Employees contribute ${pc(KIWISAVER.employeeDefault)} of gross pay by default. They can choose a higher rate (up to 10%) instead, or 3% with a rate reduction from IRD.` },
    { act: "kiwisaver", section: "10", heading: "Who automatic enrolment rules apply to", anchor: "DLM378830",
      says: "New employees aged 18 or over, and under the NZ Super age, are enrolled automatically when they start a new job." },
    { act: "kiwisaver", section: "16", heading: "Time limit for opting out", anchor: "DLM378847",
      says: "An automatically enrolled employee can opt out from the 13th to the 55th day after starting the job." },
    { act: "kiwisaver", section: "66", heading: "Obligation to make deductions: general rule", anchor: "DLM379040",
      says: "The employer must take the employee's contribution out of every pay." },
    { act: "kiwisaver", section: "101B", heading: "Compulsory contributions must be paid on top of gross salary or wages except to extent that parties otherwise agree after 13 December 2007", anchor: "DLM1233471",
      says: "The employer's compulsory contribution is paid on top of gross pay, not taken out of it (unless agreed otherwise)." },
    { act: "kiwisaver", section: "101C", heading: "Employee’s requirements", anchor: "DLM1233473",
      says: "Compulsory employer contributions are for contributing members aged 16 or over." },
    { act: "kiwisaver", section: "101D", heading: "Compulsory employer contribution amount: general rule", anchor: "DLM1233474",
      says: `The compulsory employer contribution is ${pc(KIWISAVER.employerMinimum)} of gross pay (3% if the employee has a rate reduction and the employer chooses to match it).` },
    { act: "ita", section: "RD 67", heading: "Calculating amounts of tax for employer's superannuation cash contributions", anchor: "DLM1520168",
      says: "Employer contributions are taxed: ESCT is withheld at the rates in schedule 1, part D of the Act." },
  ],
  holidays: [
    { act: "holidays", section: "16", heading: "Entitlement to annual holidays", anchor: "DLM236874",
      says: "After each 12 months of continuous work, an employee is entitled to at least 4 weeks' paid annual holidays." },
    { act: "holidays", section: "21", heading: "Calculation of annual holiday pay", anchor: "DLM236884",
      says: "Holiday pay is the greater of the employee's ordinary weekly pay and their average weekly earnings over the last 12 months." },
    { act: "holidays", section: "28", heading: "When annual holiday pay may be paid with employee's pay", anchor: "DLM236893",
      says: "Holiday pay can be paid with each pay (at least 8% of gross earnings) only for fixed-term jobs under 12 months or very irregular work, and it must be agreed." },
    { act: "holidays", section: "44", heading: "Days that are public holidays", anchor: "DLM237120",
      says: "The list of public holidays, including Matariki." },
    { act: "holidays", section: "50", heading: "Employer must pay employee at least time and a half for working on public holiday", anchor: "DLM237128",
      says: "Working on a public holiday is paid at least time and a half." },
    { act: "holidays", section: "56", heading: "Alternative holiday must be provided if employee works on public holiday", anchor: "DLM237143",
      says: "Working a public holiday that would have been a normal working day also earns a paid day off later (an alternative holiday)." },
    { act: "holidays", section: "63", heading: "Entitlement to sick leave and bereavement leave", anchor: "DLM237158",
      says: "Sick and bereavement leave start after 6 months' continuous employment (or 6 months of regular hours)." },
    { act: "holidays", section: "65", heading: "Sick leave", anchor: "DLM237161",
      says: "An employee is entitled to 10 days' sick leave a year, for their own illness or to care for a partner or dependant." },
    { act: "holidays", section: "66", heading: "Sick leave may be carried over", anchor: "DLM237163",
      says: "Up to 10 unused sick days carry over, to a maximum of 20 days' entitlement in any year." },
    { act: "holidays", section: "70", heading: "Duration of bereavement leave", anchor: "DLM237174",
      says: "3 days' bereavement leave for a close family member or a pregnancy loss; 1 day for anyone else." },
    { act: "holidays", section: "81", heading: "Holiday and leave record", anchor: "DLM237190",
      says: "Employers must keep a holiday and leave record for every employee." },
  ],
  employment: [
    { act: "minwage", section: "4", heading: "Prescribed minimum adult rate of wages", anchor: "DLM74414",
      says: "The minimum adult wage (for workers 16 and over) is set by the government each year as a dollar amount." },
    { act: "minwage", section: "6", heading: "Payment of minimum wages", anchor: "DLM74418",
      says: "Workers must be paid at least the minimum rate, whatever their contract says." },
    { act: "era", section: "65", heading: "Form and content of individual employment agreement", anchor: "DLM59157",
      says: "An individual employment agreement must be in writing and include certain terms, such as the work to be done and the hours." },
    { act: "era", section: "67A", heading: "Employment agreement may contain provision for trial period for 90 days or less", anchor: "DLM1867204",
      says: "A written trial period of up to 90 days is allowed for someone the employer hasn't employed before." },
    { act: "era", section: "130", heading: "Wages and time record", anchor: "DLM60375",
      says: "Employers must keep a wages and time record for every employee." },
  ],
  acc: [
    { act: "acc", section: "168", heading: "Employers to pay levies", anchor: "DLM101876",
      says: "Employers pay levies to fund ACC's Work Account, due at least 30 days after ACC's invoice." },
    { act: "acc", section: "219", heading: "Earners to pay levies", anchor: "DLM102835",
      says: "Earners pay a levy to fund ACC's Earners' Account, at the rate set by regulations each year." },
    { act: "acc", section: "15", heading: "Earnings as a shareholder-employee", anchor: "DLM100645",
      says: "A shareholder-employee's earnings include salary paid without PAYE (from the company's tax return), so the work levy and earners' levy apply to it." },
    { act: "ita", section: "EF 3", heading: "Accident compensation levies and premiums", anchor: "DLM1514780",
      says: "An employer's deduction for an ACC levy belongs to the income year the levy becomes due and payable, not the year it's accrued." },
  ],
  "income-tax": [
    { act: "ita", section: "BC 5", heading: "Taxable income", anchor: "DLM1512344",
      says: "Taxable income is net income less any tax losses available." },
    { act: "ita", section: "DA 1", heading: "General permission", anchor: "DLM1513555",
      says: "Spending is deductible to the extent it's incurred in earning income or running the business." },
    { act: "ita", section: "DA 2", heading: "General limitations", anchor: "DLM1513558",
      says: "Capital spending and private spending are not deductible." },
    { act: "ita", section: "DD 1", heading: "Entertainment expenditure generally", anchor: "DLM1513809",
      says: "Only 50% of entertainment of the kinds listed in s DD 2 (such as food and drink off the premises) is deductible." },
    { act: "ita", section: "EA 4", heading: "Deferred payment of employment income", anchor: "DLM1514274",
      says: "Holiday pay, bonuses and other employment costs accrued at year end are deductible that year only if paid within 63 days (longer for shareholder-employees)." },
    { act: "ita", section: "DB 1", heading: "Taxes, other than GST, and penalties", anchor: "DLM1513572",
      says: "Income tax and tax penalties are not deductible." },
    { act: "taa", section: "33", heading: "Returns of income", anchor: "DLM351027",
      says: "Every taxpayer (apart from one with only exempt income) must file a return of income each tax year, in the form IRD prescribes: for a company, the IR4." },
    { act: "taa", section: "37", heading: "Dates by which annual returns to be furnished", anchor: "DLM351161",
      says: "Annual income tax returns are due by 7 July (later for a late balance date, or when IRD extends the time for a tax agent's clients)." },
  ],
  "provisional-tax": [
    { act: "ita", section: "RC 3", heading: "Who is required to pay provisional tax?", anchor: "DLM1519805",
      says: "You pay provisional tax if your residual income tax (RIT) for the year is more than $5,000." },
    { act: "ita", section: "RC 5", heading: "Methods for calculating provisional tax liability", anchor: "DLM1519810",
      says: "The methods: the standard method (last year's RIT plus 5%), estimation, and others such as the GST ratio and AIM." },
    { act: "ita", section: "RC 9", heading: "Provisional tax payable in instalments", anchor: "DLM1519822",
      says: "Under the standard and estimation methods, the year's provisional tax is split evenly over the instalments." },
  ],
  shareholders: [
    { act: "ita", section: "GB 25", heading: "Close company remuneration to shareholders, directors, or relatives", anchor: "DLM1516963",
      says: "If IRD considers pay to a shareholder, director or relative excessive, the excess is treated as a dividend. This doesn't apply to an adult NZ resident who works substantially full-time in the business and helps run it, if the pay wasn't influenced by the family relationship." },
    { act: "ita", section: "RD 3B", heading: "Shareholders who are employees, for some companies: income other than PAYE", anchor: "DLM7224992",
      says: "A shareholder-employee who isn't paid regular wages can choose to be taxed on their salary through their own return, without PAYE." },
    { act: "ita", section: "EA 4", heading: "Deferred payment of employment income", anchor: "DLM1514274",
      says: "A shareholder salary counts for the year it relates to if it's paid by the latest date that year's return could be filed with an extension." },
    { act: "ita", section: "GB 27", heading: "Attribution rule for income from personal services", anchor: "DLM1516971",
      says: "A contractor's company income can be taxed as the person's own if 80% or more comes from one client, 80% or more is their own work, their income is over $78,100, and the business has no substantial assets. A café with many customers isn't caught." },
    { act: "ita", section: "CD 1", heading: "Dividend", anchor: "DLM1512540",
      says: "A dividend is income of the shareholder who receives it." },
    { act: "ita", section: "CX 10", heading: "Employment-related loans", anchor: "DLM1513350",
      says: "A loan from an employer to an employee is a fringe benefit, so an overdrawn current account at low interest can attract FBT." },
    { act: "ita", section: "LE 1", heading: "Tax credits for imputation credits", anchor: "DLM1518026",
      says: "Imputation credits attached to a dividend give the shareholder a tax credit for tax the company already paid." },
    { act: "ita", section: "OB 1", heading: "General rules for companies with imputation credit accounts", anchor: "DLM1518696",
      says: "A New Zealand company must keep an imputation credit account." },
    { act: "ita", section: "OB 4", heading: "ICA payment of tax or transfer to account", anchor: "DLM1518705",
      says: "Income tax or provisional tax the company pays is a credit in its imputation credit account." },
    { act: "ita", section: "OB 8", heading: "ICA resident withholding tax withheld", anchor: "DLM1518714",
      says: "RWT taken off the company's interest is a credit in the account, on the day it's withheld." },
    { act: "ita", section: "OB 30", heading: "ICA payment of dividend", anchor: "DLM1518762",
      says: "Imputation credits attached to a dividend are a debit in the account, on the day the dividend is paid." },
    { act: "companies", section: "4", heading: "Meaning of solvency test", anchor: "DLM319998",
      says: "The solvency test: the company can pay its debts as they fall due, and its assets are worth more than its liabilities." },
    { act: "companies", section: "52", heading: "Board may authorise distributions", anchor: "DLM320170",
      says: "Directors may only pay a dividend if they're satisfied on reasonable grounds the company will pass the solvency test straight afterwards, and they must sign a certificate saying so." },
    { act: "companies", section: "135", heading: "Reckless trading", anchor: "DLM320666",
      says: "Directors must not run the business in a way likely to cause a substantial risk of serious loss to creditors." },
    { act: "companies", section: "136", heading: "Duty in relation to obligations", anchor: "DLM320667",
      says: "Directors must not let the company take on an obligation unless they reasonably believe it can meet it." },
  ],
  depreciation: [
    { act: "ita", section: "EE 1", heading: "What this subpart does", anchor: "DLM1514491",
      says: "Depreciation of business assets is a deduction, and selling one for more than its tax value can create depreciation recovery income." },
    { act: "ita", section: "EE 12", heading: "Depreciation methods", anchor: "DLM1514526",
      says: "The methods: diminishing value, straight line, and pooling." },
    { act: "ita", section: "EE 38", heading: "Items of low value", anchor: "DLM1514633",
      says: "An item costing $1,000 or less (bought on or after 17 March 2021) can be deducted in full straight away instead of depreciated." },
    { act: "ita", section: "EE 65", heading: "Meaning of maximum pooling value", anchor: "DLM1514735",
      says: "Items worth $5,000 or less can be pooled and depreciated together." },
    { act: "ita", section: "EE 48", heading: "Effect of disposal or event", anchor: "DLM1514660",
      says: "Sell an asset for more than its adjusted tax value and the difference (up to the depreciation claimed) is depreciation recovery income." },
    { act: "ita", section: "DI 5", heading: "New investment asset deduction", anchor: "LMS1446084",
      says: "Investment Boost: an extra deduction of 20% of the cost of a new depreciable asset, in the income year it becomes a “new investment asset” (s DI 4)." },
  ],
  inventory: [
    { act: "ita", section: "EB 3", heading: "Valuation of trading stock", anchor: "DLM1514289",
      says: "A business must value its trading stock at the end of each income year, by a method the Act allows." },
    { act: "ita", section: "EB 13", heading: "Low-turnover valuation", anchor: "DLM1514313",
      says: "A low-turnover trader (turnover, with associated persons, of no more than $3,000,000) can use simpler valuation methods." },
    { act: "ita", section: "EB 23", heading: "Valuing closing stock under $10,000", anchor: "DLM1514335",
      says: "With turnover of $1,300,000 or less and closing stock reasonably estimated at under $10,000, closing stock can be valued at its opening value." },
  ],
  "other-taxes": [
    { act: "ita", section: "RE 3", heading: "Obligation to withhold RWT", anchor: "DLM1520198",
      says: "Payers of interest and dividends must withhold resident withholding tax (RWT) and pay it to IRD." },
    { act: "ita", section: "CX 2", heading: "Meaning of fringe benefit", anchor: "DLM1513332",
      says: "A fringe benefit is a non-cash benefit an employer gives an employee because of their job, such as private use of a work car." },
    { act: "ita", section: "RD 45", heading: "Unclassified benefits and gift cards", anchor: "DLM1520066",
      says: "Small benefits are free of FBT up to $300 per employee a quarter, and $22,500 for all employees over a year." },
    { act: "ita", section: "RD 8", heading: "Schedular payments", anchor: "DLM1519955",
      says: "Schedular payments are payments to contractors of the kinds in schedule 4, which have tax withheld." },
  ],
  compliance: [
    { act: "taa", section: "22", heading: "Keeping of business and other records", anchor: "DLM350462",
      says: "Businesses must keep their records for at least 7 years after the end of the income year." },
    { act: "gst", section: "75", heading: "Keeping of records", anchor: "DLM85281",
      says: "GST records, including invoices and taxable supply information, must be kept for at least 7 years." },
    { act: "taa", section: "21B", heading: "Preparing financial statements", anchor: "DLM5966518",
      says: "Companies must prepare financial statements meeting IRD's minimum requirements (set by Order in Council)." },
    { act: "companies", section: "194", heading: "Accounting records must be kept", anchor: "DLM320874",
      says: "The board must make sure accounting records correctly record the company's transactions." },
    { act: "companies", section: "196", heading: "Overview", anchor: "DLM320877",
      says: "Full GAAP financial statements are required only from large companies, companies with 10 or more shareholders, or when shareholders with 5% of the votes ask. A small company like Kōwhai only needs the tax minimum." },
    { act: "companies", section: "214", heading: "Annual return", anchor: "DLM321131",
      says: "Every company files an annual return with the Companies Office, in its allocated month." },
  ],
};

/** the law behind an Explore tool, keyed by the tool's slug (shown in the same "The law" box) */
export const TOOL_LAW: Record<string, LawRef[]> = {
  "year-end": [
    { act: "ita", section: "DB 31", heading: "Bad debts", anchor: "DLM1513650",
      says: "A bad debt is deductible only if it's written off as bad in the income year: so before balance date." },
    { act: "ita", section: "EA 4", heading: "Deferred payment of employment income", anchor: "DLM1514274",
      says: "Holiday pay, bonuses and other employment costs accrued at year end are deductible that year only if paid within 63 days (longer for shareholder-employees)." },
    { act: "taa", section: "21B", heading: "Preparing financial statements", anchor: "DLM5966518",
      says: "Companies must prepare financial statements meeting IRD's minimum requirements (set by Order in Council)." },
    { act: "fso", section: "5", heading: "Small companies exempt from minimum requirements", anchor: "DLM5975817",
      says: "A company that isn't part of a group, and whose income and expenditure are each $30,000 or less, is exempt. Kōwhai is well over that." },
    { act: "fso", section: "8", heading: "Minimum requirements for preparing financial statements", anchor: "DLM5975821",
      says: "A balance sheet and a profit and loss statement, on double-entry and accrual principles, with a statement of accounting policies, whether figures include GST, last year's comparative figures, and interest shown before RWT." },
    { act: "fso", section: "Schedule", heading: "Matters that financial statements must show", anchor: "DLM5975819",
      says: "Including a reconciliation from the accounts to taxable income, and a tax-based schedule of the fixed assets and depreciation." },
    { act: "companies", section: "120", heading: "Annual meeting of shareholders", anchor: "DLM320614",
      says: "An annual meeting within 6 months of balance date (the first within 18 months of registration), unless the board resolves there's nothing that needs doing at one." },
    { act: "companies", section: "122", heading: "Resolution in lieu of meeting", anchor: "DLM320619",
      says: "Shareholders can pass a resolution in writing, signed by enough of them, instead of holding a meeting." },
    { act: "companies", section: "208", heading: "Obligation to prepare annual report", anchor: "DLM321105",
      says: "An annual report is needed only from large companies, public entities, companies with 10 or more shareholders that haven't opted out, and companies that opt in." },
    { act: "companies", section: "214", heading: "Annual return", anchor: "DLM321131",
      says: "Every company files an annual return with the Companies Office in the month allocated to it, but not in the calendar year it was registered." },
    { act: "taa", section: "22", heading: "Keeping of business and other records", anchor: "DLM350462",
      says: "Businesses must keep their records for at least 7 years after the end of the income year." },
  ],
  structures: [
    { act: "ita", section: "HG 2", heading: "Partnerships are transparent", anchor: "DLM1185059",
      says: "For income tax, partners are treated as carrying on the partnership's activities themselves: each is taxed on their share of its income." },
    { act: "ita", section: "HB 1", heading: "Look-through companies are transparent", anchor: "DLM3676672",
      says: "Once the owners elect it, a look-through company is treated like a partnership for income tax: the owners are taxed on its income (but not for PAYE, FBT, RWT and similar rules)." },
    { act: "ita", section: "HB 13", heading: "LTC elections", anchor: "DLM3676669",
      says: "A company becomes a look-through company by an election signed by a director, with notices from all its owners agreeing to it, sent to IRD." },
    { act: "ita", section: "YA 1", heading: "Definitions", anchor: "DLM1520575",
      says: "A look-through company may have no more than 5 look-through counted owners, with relatives counted as one owner." },
    { act: "ita", section: "HB 11", heading: "Limitation on deductions by persons with interests in look-through companies", anchor: "DLM3678210",
      says: "The old limit on owners using an LTC's losses now only applies when the LTC is a partner with another LTC. Otherwise owners can set the losses against their other income." },
    { act: "ita", section: "DC 3B", heading: "Payments to working owners", anchor: "DLM3683703",
      says: "An LTC can deduct salary paid to a working owner under a written employment contract that sets out the work and the pay." },
    { act: "ita", section: "DC 4", heading: "Payments to working partners", anchor: "DLM1513765",
      says: "A partnership can deduct salary paid to a working partner under a written contract that all the partners have entered into." },
    { act: "companies", section: "15", heading: "Separate legal personality", anchor: "DLM320115",
      says: "A company is a legal person in its own right, separate from its shareholders." },
    { act: "companies", section: "97", heading: "Liability of shareholders", anchor: "DLM320464",
      says: "A shareholder isn't liable for the company's obligations just because they're a shareholder (unless the constitution says otherwise)." },
    { act: "partnership", section: "22", heading: "Liability of partners for firm’s debts and obligations", anchor: "LMS206010",
      says: "Every partner is liable, jointly with the other partners, for all the firm's debts incurred while they're a partner." },
    { act: "partnership", section: "25", heading: "Liability for wrongful acts or omissions is joint and several", anchor: "LMS206015",
      says: "For wrongs done in the firm's business, each partner is liable jointly with the others and also on their own." },
  ],
  "provisional-tax": [
    { act: "ita", section: "RC 6", heading: "Standard method", anchor: "DLM1519812",
      says: "Under the standard method, this year's provisional tax is based on last year's residual income tax (plus the uplift)." },
    { act: "ita", section: "RC 7", heading: "Estimation method", anchor: "DLM1519814",
      says: "A taxpayer may make a fair and reasonable estimate of the year's residual income tax, and revise it on or before any instalment date." },
    { act: "ita", section: "RC 7B", heading: "AIM method", anchor: "LMS42723",
      says: "The AIM method works out provisional tax with an approved AIM-capable accounting system, from the business's accounts as the year goes." },
    { act: "ita", section: "RC 11", heading: "Calculating amount of instalment using GST ratio", anchor: "DLM1519833",
      says: "Under the GST ratio, each instalment is the ratio times the taxable supplies in the matching GST period." },
    { act: "ita", section: "RC 16", heading: "Who may use GST ratio?", anchor: "DLM1519846",
      says: "The GST ratio needs last year's RIT over $5,000 and no more than $150,000, GST registration all last year for a business that didn't begin operating that year, and monthly or two-monthly GST." },
    { act: "taa", section: "120KE", heading: "Provisional tax and rules on use of money interest", anchor: "DLM355315",
      says: "Standard-method taxpayers with RIT under $60,000 aren't charged (or paid) use-of-money interest until their terminal tax date." },
    { act: "taa", section: "120KBB", heading: "Interest for most standard method provisional taxpayers", anchor: "DLM7227374",
      says: "Other standard-method taxpayers who pay their earlier instalments on time are charged interest only from the last instalment date." },
    { act: "taa", section: "139B", heading: "Late payment penalty", anchor: "DLM356138",
      says: "Tax paid late attracts a 1% penalty the day after it's due and a further 4% a week later. For income tax from 2017–18, there's no further 1% each month." },
  ],
};
