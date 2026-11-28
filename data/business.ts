import type { Employee } from "@/lib/nz/payroll";
import { PAYROLL_2026_27 } from "@/lib/nz/rates";
import type { FixedAsset } from "@/lib/nz/assets";

/** All names, numbers and addresses are made up for teaching. */
export const BUSINESS = {
  name: "Kōwhai Café Ltd",
  tradingAs: "Kōwhai Café",
  address: ["14 Esplanade Road", "Seaview Bay, Wellington 5012"],
  structure: "Limited liability company",
  companyNumber: "9000001 (example)",
  irdNumber: "123-456-789 (example)",
  gstNumber: "123-456-789 (example)",
  gstBasis: "Invoice basis",
  gstFrequency: "Two-monthly",
  balanceDate: "31 March",
  yearStart: "2026-04-01",
  yearEnd: "2027-03-31",
  incomeYear: "2027 income year (1 April 2026 – 31 March 2027)",
  bank: "Harbour Bank",
  bankAccount: "02-0500-0123456-00",
  story:
    "Aroha Ngata spent ten years as a barista and café manager. With her friend Ben Fraser, who has some savings and a day job in IT, she's opening her own café in a seaside suburb of Wellington. They set up a company, Kōwhai Café Ltd, so their personal assets are protected if the business fails. Aroha owns 60% of the shares and works in the café full-time. Ben owns 40%, helps on weekends and does the books in the evenings.",
};

/**
 * `otherIncome`: income outside Kōwhai (Ben's IT day job, taxed through PAYE by that employer; an assumed figure).
 * `fullTime`: works substantially full-time in the business (the exemption in Income Tax Act s GB 25).
 * `hours`: Ben's usual weekly hours at Kōwhai, used to judge whether his salary is reasonable for the work.
 */
export const SHAREHOLDERS = [
  { id: "aroha", name: "Aroha Ngata", shares: 60_000, pct: 0.6, role: "Director & café manager", currentAccount: "240", salary: 60_000, otherIncome: 0, fullTime: true, hours: { cafe: 45, books: 0 } },
  { id: "ben", name: "Ben Fraser", shares: 40_000, pct: 0.4, role: "Director & weekend help / bookkeeper", currentAccount: "241", salary: 30_000, otherIncome: 90_000, fullTime: false, hours: { cafe: 14, books: 6 } },
];

/** an assumed hourly rate for part-time bookkeeping, to price Ben's book-keeping work (café shifts are priced at Leo's wage) */
export const BOOKKEEPING_RATE = 35;

export const EMPLOYEES: Employee[] = [
  {
    id: "mia",
    name: "Mia Thompson",
    role: "Full-time barista (permanent)",
    rate: 26.0,
    code: "ME",
    studentLoan: true,
    kiwiSaver: PAYROLL_2026_27.kiwiSaver.employeeDefault,
    casual: false,
    irdNumber: "111-222-333 (example)",
  },
  {
    id: "leo",
    name: "Leo Tuilagi",
    role: "Casual kitchen hand (university student)",
    rate: 24.5,
    code: "M",
    studentLoan: false,
    kiwiSaver: PAYROLL_2026_27.kiwiSaver.employeeDefault,
    casual: true,
    irdNumber: "444-555-666 (example)",
  },
];

export const SUPPLIERS = {
  roaster: { name: "Southern Roasters Ltd", gst: "98-765-432", detail: ["Unit 4, 22 Kiln Street", "Lower Hutt 5010"] },
  food: { name: "Fresh Fields Wholesale Ltd", gst: "87-654-321", detail: ["180 Market Road", "Porirua 5022"] },
  dairy: { name: "Valley Dairy Co-op", gst: "76-543-210", detail: ["9 Paddock Lane", "Masterton 5810"] },
  packaging: { name: "GreenCup Packaging Ltd", gst: "65-432-109", detail: ["3 Compost Way", "Wellington 6011"] },
  machine: { name: "Bean Machine Supplies Ltd", gst: "54-321-098", detail: ["77 Crema Street", "Auckland 1010"] },
  builder: { name: "Totara Shopfitters Ltd", gst: "43-210-987", detail: ["12 Joinery Road", "Petone 5012"] },
  furniture: { name: "Harbourside Furniture Ltd", gst: "32-109-876", detail: ["45 Seat Street", "Wellington 6011"] },
  tech: { name: "TillTech NZ Ltd", gst: "21-098-765", detail: ["8 Byte Avenue", "Wellington 6011"] },
  landlord: { name: "Esplanade Properties Ltd", gst: "19-876-543", detail: ["PO Box 4410", "Wellington 6140"] },
  insurer: { name: "Kiwi Shield Insurance Ltd", gst: "18-765-432", detail: ["PO Box 1200", "Auckland 1140"] },
  power: { name: "Kahu Energy Ltd", gst: "17-654-321", detail: ["PO Box 900", "Wellington 6140"] },
  internet: { name: "Fibrelink NZ Ltd", gst: "16-543-210", detail: ["PO Box 300", "Auckland 1140"] },
  accountant: { name: "Rata & Co Chartered Accountants", gst: "15-432-109", detail: ["Level 2, 50 Lambton Quay", "Wellington 6011"] },
  appliance: { name: "Kitchen Bits Ltd", gst: "14-321-098", detail: ["2 Whisk Road", "Wellington 6011"] },
  council: { name: "Seaview City Council", gst: "13-210-987", detail: ["PO Box 2199", "Wellington 6140"] },
  cleaning: { name: "SparkleClean Supplies Ltd", gst: "12-109-876", detail: ["66 Mop Street", "Lower Hutt 5010"] },
  waste: { name: "Green Bin Collection Ltd", gst: "11-098-765", detail: ["PO Box 77", "Wellington 6140"] },
  software: { name: "CloudBooks NZ Ltd", gst: "10-987-654", detail: ["Online subscription"] },
};

export const CUSTOMERS = {
  tui: { name: "Tūī Consulting Ltd", detail: ["Level 3, 10 Customhouse Quay", "Wellington 6011"] },
  harbourLaw: { name: "Harbour Law Partners", detail: ["Level 8, 1 Willis Street", "Wellington 6011"] },
  popup: { name: "Pop-Up Events Ltd", detail: ["22 Festival Lane", "Wellington 6011"] },
  school: { name: "Seaview Primary School", detail: ["1 School Road", "Seaview Bay 5012"] },
  wedding: { name: "J. & K. Morgan (wedding)", detail: ["41 Bay View Road", "Seaview Bay 5012"] },
};

/** Fixed assets bought in April 2026. Depreciation rates are illustrative – look up real rates in IRD's rate finder. */
export const FIXED_ASSETS: FixedAsset[] = [
  { id: "espresso", name: "Commercial espresso machine & grinder", costAccount: "160", accDepAccount: "161", cost: 16_000, acquired: "2026-04-04", dvRate: 0.3, slRate: 0.21, investmentBoost: true },
  { id: "fitout", name: "Café fit-out (counters, shelving, lighting)", costAccount: "165", accDepAccount: "166", cost: 30_000, acquired: "2026-04-05", dvRate: 0.2, slRate: 0.135, investmentBoost: true },
  { id: "furniture", name: "Tables & chairs", costAccount: "170", accDepAccount: "171", cost: 8_000, acquired: "2026-04-06", dvRate: 0.16, slRate: 0.105, investmentBoost: true },
  { id: "computers", name: "POS terminal, laptop & printer", costAccount: "175", accDepAccount: "176", cost: 2_000, acquired: "2026-04-07", dvRate: 0.5, slRate: 0.4, investmentBoost: true },
];

export const LOAN = { principal: 50_000, rate: 0.085, months: 60, start: "2026-04-02", lender: "Harbour Bank" };

/** Ex-GST monthly café (counter) sales – busier in summer */
export const MONTHLY_SALES: Record<string, number> = {
  "2026-05": 34_000,
  "2026-06": 31_000,
  "2026-07": 30_000,
  "2026-08": 31_500,
  "2026-09": 34_000,
  "2026-10": 37_000,
  "2026-11": 39_000,
  "2026-12": 44_000,
  "2027-01": 41_000,
  "2027-02": 40_000,
  "2027-03": 38_000,
};

/** Fraction of each sales dollar spent on each kind of stock (ex GST) */
export const PURCHASE_MIX = { coffee: 0.09, food: 0.16, dairy: 0.04, packaging: 0.02 };

export const CLOSING_STOCK = [
  { item: "Coffee beans (38 kg)", qty: "38 kg", value: 1_368 },
  { item: "Dry goods & frozen food", qty: "various", value: 1_512 },
  { item: "Milk & dairy (unopened, in date)", qty: "various", value: 220 },
  { item: "Takeaway cups, lids & bags", qty: "4 cartons", value: 700 },
];
