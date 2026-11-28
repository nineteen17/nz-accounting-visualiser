/**
 * Every NZ rate and threshold the app uses lives in this one file.
 * Figures are for the 2026–27 income year (1 April 2026 – 31 March 2027), Kōwhai Café Ltd's
 * first year. Payroll rates have one set per income year (see PAYROLL_2026_27 / PAYROLL_2027_28):
 * the café's books use the set for their own dates, and the lessons use CURRENT_PAYROLL.
 * Lesson text reads figures from here too, so a change here is the only change needed
 * (tests/rates.test.ts fails if a figure gets typed in somewhere else).
 *
 * Checked November 2026. Rates change every year, so always confirm on
 * ird.govt.nz / employment.govt.nz / acc.co.nz before relying on them.
 */

export const RATES_AS_AT = "November 2026 (2026–27 income year)";

export const GST = {
  rate: 0.15,
  /** fraction of a GST-inclusive price that is GST */
  fraction: 3 / 23,
  registrationThreshold: 60_000,
  source: "https://www.ird.govt.nz/gst",
};

/** Company income tax rate */
export const COMPANY_TAX_RATE = 0.28;

/* ───────────── payroll rates, one set per income year ─────────────
 *
 * Payroll figures change on 1 April. Each income year has its own set, and each of the café's
 * years uses the set for its own dates, so new rates never rewrite an earlier year's books.
 *
 * When a new year's rates are announced:
 *   1. fill in (or correct) that year's set below and empty its `toConfirm` list;
 *   2. from 1 April, point CURRENT_PAYROLL at it: the lessons, calculators and drills follow.
 */

export interface PayrollRates {
  /** income year, 1 April – 31 March */
  year: string;
  /** individual income tax brackets */
  brackets: { upTo: number; rate: number }[];
  /** independent earner tax credit: $10/week for $24,000–$70,000, abating from $66,000 */
  ietc: { annual: number; from: number; abateFrom: number; to: number; abatementRate: number };
  /** ACC earners' levy (per $1 of earnings, incl GST), capped at max liable earnings */
  acc: { rate: number; maxLiableEarnings: number };
  studentLoan: { rate: number; annualThreshold: number; fortnightlyThreshold: number; weeklyThreshold: number };
  /** KiwiSaver default employee rate and compulsory employer minimum */
  kiwiSaver: { employeeDefault: number; employerMinimum: number };
  /** ESCT bands: employee's salary + gross employer contributions for the previous year */
  esct: { upTo: number; rate: number }[];
  /** figures carried forward from the year before because they hadn't been announced yet */
  toConfirm: string[];
}

export const PAYROLL_2026_27: PayrollRates = {
  year: "2026–27",
  // unchanged since 1 April 2025
  brackets: [
    { upTo: 15_600, rate: 0.105 },
    { upTo: 53_500, rate: 0.175 },
    { upTo: 78_100, rate: 0.3 },
    { upTo: 180_000, rate: 0.33 },
    { upTo: Infinity, rate: 0.39 },
  ],
  ietc: { annual: 520, from: 24_000, abateFrom: 66_000, to: 70_000, abatementRate: 0.13 },
  // $1.75 per $100
  acc: { rate: 0.0175, maxLiableEarnings: 156_641 },
  studentLoan: { rate: 0.12, annualThreshold: 24_128, fortnightlyThreshold: 928, weeklyThreshold: 464 },
  // the default rose from 3% to 3.5% on 1 April 2026
  kiwiSaver: { employeeDefault: 0.035, employerMinimum: 0.035 },
  esct: [
    { upTo: 18_720, rate: 0.105 },
    { upTo: 64_200, rate: 0.175 },
    { upTo: 93_720, rate: 0.3 },
    { upTo: 216_000, rate: 0.33 },
    { upTo: Infinity, rate: 0.39 },
  ],
  toConfirm: [],
};

/** the café's second year. ACC's levy was set for 2025–28; KiwiSaver stays 3.5% until 1 April 2028 */
export const PAYROLL_2027_28: PayrollRates = {
  ...PAYROLL_2026_27,
  year: "2027–28",
  // $1.83 per $100
  acc: { rate: 0.0183, maxLiableEarnings: 160_244 },
  toConfirm: ["tax brackets", "IETC", "student loan threshold", "ESCT bands"],
};

/** the income year the lessons, calculators and drills teach: move it on each 1 April */
export const CURRENT_PAYROLL = PAYROLL_2026_27;

/** the day the next income year's rates apply ("2027-04-01" while the course teaches 2026–27) */
export const NEXT_RATES_FROM = `${Number(CURRENT_PAYROLL.year.slice(0, 4)) + 1}-04-01`;
/** true once that day has come and CURRENT_PAYROLL still hasn't been moved on (see README: "Updating the rates") */
export const ratesOutOfDate = (todayIso: string) => todayIso >= NEXT_RATES_FROM;

/* the current year's figures, under the names the lessons use */

export const INDIVIDUAL_TAX_BRACKETS = CURRENT_PAYROLL.brackets;
export const IETC = CURRENT_PAYROLL.ietc;
export const ACC_EARNERS_LEVY = {
  ...CURRENT_PAYROLL.acc,
  source: "https://www.acc.co.nz/for-business/received-an-invoice/calculate-your-levies/",
};
/**
 * The other ACC levies on a café's liable earnings (an employer's payroll, or a self-employed person's earnings),
 * per $1, excluding GST: ACC Levy Guidebook 2026/27, classification unit 57300 "Cafes and restaurants".
 * The work levy is the same for employers and CoverPlus self-employed. 2027–28's rates are still to confirm.
 */
export const ACC_CAFE_LEVIES = {
  levyYear: "2026/27",
  classificationUnit: "57300 Cafes and restaurants",
  // $0.40 per $100
  work: 0.004,
  // $0.08 per $100, collected for WorkSafe
  workingSafer: 0.0008,
  toConfirm: ["2027/28 work levy", "2027/28 working safer levy", "minimum liable earnings for full-time self-employed"],
  source: "https://www.acc.co.nz/assets/business/Levy-Guidebook-2026-2027.pdf",
};
export const KIWISAVER = {
  ...CURRENT_PAYROLL.kiwiSaver,
  otherEmployeeRates: [0.035, 0.04, 0.06, 0.08, 0.1],
  previousDefault: 0.03,
  futureRate: { rate: 0.04, from: "1 April 2028" },
  source: "https://www.ird.govt.nz/kiwisaver-changes",
};
export const ESCT_BANDS = CURRENT_PAYROLL.esct;
export const STUDENT_LOAN = { ...CURRENT_PAYROLL.studentLoan, source: "https://www.ird.govt.nz/student-loans" };

export const MINIMUM_WAGE = {
  adult: 23.95,
  startingOut: 19.16,
  training: 19.16,
  from: "1 April 2026",
  previousAdult: 23.5,
  /** starting-out and training rates are 80% of the adult rate */
  youthShare: 0.8,
  source: "https://www.employment.govt.nz/pay-and-hours/pay-and-wages/minimum-wage",
};

export const HOLIDAYS = {
  annualLeaveWeeks: 4,
  payAsYouGoRate: 0.08,
  publicHolidays: 12,
  sickLeaveDays: 10,
  bereavementDays: "3 days (close family) / 1 day (others)",
};

export const PROVISIONAL_TAX = {
  ritThreshold: 5_000,
  standardUplift: 0.05,
  safeHarbourRit: 60_000,
  /** use-of-money interest from 16 January 2026 (IRD reviews these rates through the year) */
  uomiFrom: "16 January 2026",
  uomiUnderpaid: 0.0897,
  uomiOverpaid: 0.0225,
  /** 31 March balance date, standard / estimation method */
  instalments: ["28 August", "15 January", "7 May"],
  source: "https://www.ird.govt.nz/income-tax/provisional-tax",
};

export const DEPRECIATION = {
  lowValueAssetThreshold: 1_000,
  investmentBoostRate: 0.2,
  investmentBoostFrom: "22 May 2025",
  buildingRate: 0,
  source: "https://www.ird.govt.nz/rate-finder",
};

/**
 * Trading stock thresholds, checked against the Income Tax Act 2007 (legislation.govt.nz, version as at
 * 4 September 2026) and IRD's "Valuing trading stock" page.
 */
export const TRADING_STOCK = {
  /** s EB 23: turnover of $1,300,000 OR LESS and closing stock reasonably estimated at LESS THAN $10,000:
   *  closing stock may be valued at its opening value, with no year-end count */
  lowValue: { turnoverUpTo: 1_300_000, stockEstimateUnder: 10_000, section: "EB 23" },
  /** s EB 13(2) "low-turnover trader": turnover (with associated persons) of NO MORE THAN $3,000,000;
   *  simpler options within each valuation method (ss EB 13–EB 22) */
  lowTurnoverUpTo: 3_000_000,
  source: "https://www.ird.govt.nz/income-tax/income-tax-for-businesses-and-organisations/types-of-business-income/trading-stock/valuing-trading-stock",
};

export const RWT = {
  companyDefault: 0.28,
  /** Dividends: RWT is 33% of (cash + imputation credits), less the imputation credits attached (IR284) */
  dividendRate: 0.33,
  individualRates: [0.105, 0.175, 0.3, 0.33, 0.39],
  noIrdNumber: 0.45,
};

export const RECORD_KEEPING_YEARS = 7;

/** Fortnightly pays in a year */
export const PAYS_PER_YEAR = 26;
