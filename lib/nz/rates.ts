/**
 * Every NZ rate and threshold the app uses lives in this one file.
 * Figures are for the 2026–27 income year (1 April 2026 – 31 March 2027),
 * which is the year Kōwhai Café Ltd trades in.
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

/** Individual income tax brackets (unchanged since 1 April 2025) */
export const INDIVIDUAL_TAX_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 15_600, rate: 0.105 },
  { upTo: 53_500, rate: 0.175 },
  { upTo: 78_100, rate: 0.3 },
  { upTo: 180_000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
];

export const COMPANY_TAX_RATE = 0.28;

/** Independent earner tax credit: $10/week ($520/yr) for $24,000–$70,000, abating from $66,000 */
export const IETC = { annual: 520, from: 24_000, abateFrom: 66_000, to: 70_000, abatementRate: 0.13 };

/** ACC earners' levy 2026–27: $1.75 per $100 incl GST, capped at max liable earnings */
export const ACC_EARNERS_LEVY = {
  rate: 0.0175,
  rateExGst: 0.0152,
  maxLiableEarnings: 156_641,
  source: "https://www.acc.co.nz/for-business/received-an-invoice/calculate-your-levies/",
};

/** ACC earners' levy 2027–28 (used for the café's second year): $1.83 per $100, max liable earnings $160,244 */
export const ACC_EARNERS_LEVY_2027_28 = {
  rate: 0.0183,
  maxLiableEarnings: 160_244,
  source: "https://www.ird.govt.nz/income-tax/income-tax-for-individuals/acc-clients-and-carers/acc-earners-levy-rates",
};

/** KiwiSaver default minimum contribution rose from 3% to 3.5% on 1 April 2026 (4% from 1 April 2028) */
export const KIWISAVER = {
  employeeDefault: 0.035,
  employerMinimum: 0.035,
  otherEmployeeRates: [0.035, 0.04, 0.06, 0.08, 0.1],
  futureRate: { rate: 0.04, from: "1 April 2028" },
  source: "https://www.ird.govt.nz/kiwisaver-changes",
};

/** ESCT bands: based on employee's salary + gross employer contributions for the previous year */
export const ESCT_BANDS: { upTo: number; rate: number }[] = [
  { upTo: 18_720, rate: 0.105 },
  { upTo: 64_200, rate: 0.175 },
  { upTo: 93_720, rate: 0.3 },
  { upTo: 216_000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
];

export const STUDENT_LOAN = {
  rate: 0.12,
  annualThreshold: 24_128,
  fortnightlyThreshold: 928,
  weeklyThreshold: 464,
  source: "https://www.ird.govt.nz/student-loans",
};

export const MINIMUM_WAGE = {
  adult: 23.95,
  startingOut: 19.16,
  training: 19.16,
  from: "1 April 2026",
  previousAdult: 23.5,
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
  /** use-of-money interest from 16 January 2026 */
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
