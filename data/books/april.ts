import type { Transaction } from "@/lib/engine/types";
import { r2 } from "@/lib/money";
import { amortise } from "@/lib/nz/loan";
import { BUSINESS, CUSTOMERS, LOAN, SUPPLIERS } from "../business";
import { buyLines, gstOf, incl, money2, salesInvoice, supplierInvoice } from "./helpers";

const loan = amortise(LOAN.principal, LOAN.rate, LOAN.months);

/** April 2026 opening sales numbers */
export const APRIL_WEEK1_EX = 6_000;
export const APRIL_REST_EX = 31_200;
export const EFTPOS_SHARE = 0.82;
export const MERCHANT_FEE = 0.009;

const wk1Incl = incl(APRIL_WEEK1_EX);
const wk1Eftpos = r2(wk1Incl * EFTPOS_SHARE);
const wk1Cash = r2(wk1Incl - wk1Eftpos);
const wk1Fee = r2(wk1Eftpos * MERCHANT_FEE);

const restIncl = incl(APRIL_REST_EX);
const restEftpos = r2(restIncl * EFTPOS_SHARE);
const restCash = r2(restIncl - restEftpos);
const restFee = r2(restEftpos * MERCHANT_FEE);

/** Remaining April stock purchases (the opening-stock invoices are separate featured transactions) */
const aprPurch = { coffee: 3_348 - 2_000, food: 5_952 - 1_500, dairy: 1_488 - 400, packaging: 744 };

export const APRIL: Transaction[] = [
  {
    id: "A01",
    date: "2026-04-01",
    title: "Aroha and Ben buy shares in the company",
    kind: "featured",
    book: "cash-receipts",
    story:
      "Day one. Kōwhai Café Ltd has just been registered with the Companies Office. Aroha pays in $60,000 and Ben $40,000 of their own savings. In return the company issues them 100,000 shares at $1 each. The money lands in the company's new bank account.\n\nThis is the first [[transaction]] the company records. The company is a separate legal person from Aroha and Ben (the [[entity-concept]]), so their savings now belong to the company, and the company owes them ownership in return. That ownership is [[equity]].",
    doc: {
      kind: "agreement",
      title: "Share Issue Resolution & Bank Deposit",
      issuer: BUSINESS.name,
      ref: "Directors' resolution 2026/01",
      date: "2026-04-01",
      rows: [
        { label: "Shares issued to Aroha Ngata", value: "60,000 ordinary shares @ $1.00" },
        { label: "Shares issued to Ben Fraser", value: "40,000 ordinary shares @ $1.00" },
        { label: "Total consideration received", value: "$100,000.00", strong: true },
        { label: "Deposited to", value: `${BUSINESS.bank} ${BUSINESS.bankAccount}` },
      ],
      footer: ["Shareholder register updated. Share issues are not a 'supply' for GST, so there's no GST."],
    },
    lines: [
      { account: "100", debit: 100_000, memo: "Shareholders' cash deposited", why: "The bank account is an asset and it's going UP. Assets go up on the debit (left) side." },
      { account: "300", credit: 100_000, memo: "100,000 shares issued", why: "Share capital is equity, the owners' stake. Equity goes up on the credit (right) side." },
    ],
    notes: [
      "Both sides are $100,000, so the [[accounting-equation]] still balances: Assets $100,000 = Liabilities $0 + Equity $100,000.",
      "No GST: issuing shares is not a sale of goods or services.",
    ],
    deepDives: [{ href: "/foundations/business-structures", label: "Why a company and not a sole trader?" }],
    quiz: {
      q: "Share capital is equity. Which side makes equity increase?",
      options: ["Debit", "Credit"],
      answer: 1,
      explain: "Equity, liabilities and income all increase with a credit. Assets and expenses increase with a debit.",
    },
  },
  {
    id: "A02",
    date: "2026-04-02",
    title: "Borrow $50,000 from Harbour Bank",
    kind: "featured",
    book: "cash-receipts",
    story:
      "$100,000 isn't enough to fit out a café, so the company borrows $50,000 from Harbour Bank over 5 years at 8.5% interest. It will repay about $1,026 a month, covering interest plus part of the [[principal]].\n\nBorrowed money is NOT income. The café hasn't earned anything; it has to pay the money back. So it's a [[liability]].",
    doc: {
      kind: "agreement",
      title: "Loan Agreement – Drawdown Notice",
      issuer: LOAN.lender,
      recipient: BUSINESS.name,
      ref: "Loan 77-4410",
      date: "2026-04-02",
      rows: [
        { label: "Principal advanced", value: "$50,000.00", strong: true },
        { label: "Interest rate", value: "8.50% p.a. fixed" },
        { label: "Term", value: "60 months" },
        { label: "Monthly repayment", value: money2(loan.payment) },
        { label: "First repayment", value: "30 April 2026" },
        { label: "Security", value: "General security agreement + personal guarantees from directors" },
      ],
      footer: ["Loans are a financial service, so no GST."],
    },
    lines: [
      { account: "100", debit: 50_000, memo: "Loan funds received", why: "More money in the bank, so the asset goes up (debit)." },
      { account: "250", credit: 50_000, memo: "Harbour Bank loan", why: "The café now owes the bank $50,000. A liability going up is a credit." },
    ],
    notes: [
      "Equation: Assets $150,000 = Liabilities $50,000 + Equity $100,000.",
      "Each repayment will be split: the interest part is an expense, and the principal part reduces the loan liability.",
      "At year end the loan is split on the balance sheet: the next 12 months' principal is a current liability, the rest is non-current.",
    ],
    deepDives: [{ href: "/explore/loan", label: "See the full loan repayment schedule" }],
  },
  {
    id: "A03",
    date: "2026-04-03",
    title: "Pay the lease bond",
    kind: "featured",
    book: "cash-payments",
    story:
      "The landlord, Esplanade Properties, needs a bond of $6,000 (two months' rent) before handing over the keys. The café will get it back when the lease ends, so it isn't an expense. It's money held for the café, which makes it an [[asset]] (non-current, because the lease runs 6 years).",
    doc: {
      kind: "receipt",
      title: "Bond Receipt",
      issuer: SUPPLIERS.landlord.name,
      recipient: BUSINESS.name,
      ref: "BOND-0042",
      date: "2026-04-03",
      rows: [
        { label: "Premises", value: "Shop 2, 14 Esplanade Road" },
        { label: "Lease term", value: "6 years from 1 April 2026" },
        { label: "Bond received", value: "$6,000.00", strong: true },
      ],
      footer: ["Bond is refundable at lease end. Not a taxable supply, so no GST is charged."],
    },
    lines: [
      { account: "150", debit: 6_000, why: "A new asset: the right to get $6,000 back. Assets go up with a debit." },
      { account: "100", credit: 6_000, why: "Money leaves the bank, so the bank asset goes DOWN. That's a credit." },
    ],
    notes: ["One asset is swapped for another (bank → bond). Total assets don't change, and nothing touches profit."],
  },
  {
    id: "A04",
    date: "2026-04-03",
    title: "Pay three months' rent in advance",
    kind: "featured",
    book: "cash-payments",
    story:
      "The lease requires rent for April, May and June ($3,000 a month + GST) up front: $10,350 in total.\n\nIt's tempting to call this a $9,000 expense. But on 3 April the café hasn't *used* those three months yet. Under the [[accrual-basis]], expenses are recorded when they're used up, not when paid. So the $9,000 goes into a [[prepayment]] asset (Prepaid rent), and $3,000 moves to Rent expense at the end of each month.",
    doc: supplierInvoice("landlord", "INV-2026-0401", "2026-04-03", [
      { desc: "Rent – April 2026", qty: 1, unit: 3_000, amount: 3_000 },
      { desc: "Rent – May 2026", qty: 1, unit: 3_000, amount: 3_000 },
      { desc: "Rent – June 2026", qty: 1, unit: 3_000, amount: 3_000 },
    ], { paid: "PAID 3/4/26", terms: "Payable in advance" }),
    lines: buyLines("135", 10_350, "100", {
      memo: "Rent Apr–Jun in advance",
      why: "Prepaid rent is an asset because the café is owed 3 months' use of the shop. Asset up = debit.",
      creditWhy: "Bank goes down = credit.",
    }),
    gstNote: "Commercial rent is a taxable supply. The landlord charges 15% GST ($1,350), and the café claims it back in its GST return.",
    notes: ["See transaction A27 at the end of April, where one month of prepaid rent is moved to expense."],
    deepDives: [{ href: "/foundations/cash-vs-accrual", label: "Cash vs accrual accounting" }],
    quiz: {
      q: "Why isn't the $9,000 an expense today?",
      options: ["Because rent isn't tax deductible", "Because the café hasn't used the premises for those months yet", "Because it was paid by bank transfer"],
      answer: 1,
      explain: "Accrual accounting matches expenses to the period they're used in. Paying early creates an asset (a prepayment).",
    },
  },
  {
    id: "A05",
    date: "2026-04-04",
    title: "Buy the espresso machine",
    kind: "featured",
    book: "cash-payments",
    story:
      "The heart of any café: a 3-group commercial espresso machine and grinder for $16,000 + GST, paid by bank transfer.\n\nIt will be used for many years, so it's [[capital-expenditure]]. It goes on the balance sheet as an asset, and its cost is spread over its life through [[depreciation]]. It is NOT an expense today. If it were, April would show a huge loss and later years would look better than they really are.",
    doc: supplierInvoice("machine", "BMS-10288", "2026-04-04", [
      { desc: "La Kōtuku 3-group espresso machine", qty: 1, unit: 13_500, amount: 13_500 },
      { desc: "On-demand grinder", qty: 1, unit: 2_100, amount: 2_100 },
      { desc: "Installation & water filter", qty: 1, unit: 400, amount: 400 },
    ], { paid: "PAID 4/4/26", terms: "Paid in full" }),
    lines: buyLines("160", 18_400, "100", {
      memo: "Espresso machine + grinder",
      why: "A long-term asset (fixed asset). Recorded at cost excl GST, because the GST is claimed back. Installation is part of cost.",
      creditWhy: "Paid from the bank.",
    }),
    gstNote: "$2,400 GST claimed back. That's why assets are recorded excl GST for a GST-registered business.",
    notes: [
      "Tax bonus: this is a NEW asset bought after 22 May 2025, so it qualifies for [[investment-boost]]: an extra 20% tax deduction in year one. This only affects the tax calculation, not the accounts.",
    ],
    deepDives: [
      { href: "/nz/depreciation", label: "Depreciation & Investment Boost explained" },
    ],
  },
  {
    id: "A06",
    date: "2026-04-05",
    title: "Pay the shopfitter for the café fit-out",
    kind: "featured",
    book: "cash-payments",
    story:
      "Totara Shopfitters built the counter, shelving, cabinet surrounds and lighting for $30,000 + GST. The fit-out belongs to the café (it's an improvement to the leased premises), and it will last for years. So it's another fixed asset.",
    doc: supplierInvoice("builder", "TS-5521", "2026-04-05", [
      { desc: "Timber service counter with cabinet surround", qty: 1, unit: 14_000, amount: 14_000 },
      { desc: "Wall shelving & menu board", qty: 1, unit: 6_500, amount: 6_500 },
      { desc: "Electrical: pendant lighting & power points", qty: 1, unit: 6_000, amount: 6_000 },
      { desc: "Painting & flooring", qty: 1, unit: 3_500, amount: 3_500 },
    ], { paid: "PAID 5/4/26", terms: "Paid on completion" }),
    lines: buyLines("165", 34_500, "100", { memo: "Café fit-out", why: "Fixed asset at cost excl GST.", creditWhy: "Paid from the bank." }),
    gstNote: "$4,500 GST claimed.",
  },
  {
    id: "A07",
    date: "2026-04-06",
    title: "Buy tables and chairs",
    kind: "featured",
    book: "cash-payments",
    story: "Ten tables, forty chairs and outdoor furniture: $8,000 + GST. Another fixed asset, in its own account so it can be depreciated at furniture rates.",
    doc: supplierInvoice("furniture", "HF-2290", "2026-04-06", [
      { desc: "Café tables (oak)", qty: 10, unit: 380, amount: 3_800 },
      { desc: "Café chairs", qty: 40, unit: 80, amount: 3_200 },
      { desc: "Outdoor bench set", qty: 2, unit: 500, amount: 1_000 },
    ], { paid: "PAID 6/4/26" }),
    lines: buyLines("170", 9_200, "100", { memo: "Furniture", why: "Fixed asset at cost excl GST.", creditWhy: "Paid from the bank." }),
    gstNote: "$1,200 GST claimed.",
    notes: ["Each chair is only $80, so why not expense it? The chairs were bought together as a set, and IRD tests the low-value threshold on the whole purchase of identical items bought at the same time."],
  },
  {
    id: "A08",
    date: "2026-04-06",
    title: "Buy a blender and small appliances (low-value assets)",
    kind: "featured",
    book: "cash-payments",
    story:
      "A commercial blender ($420), a toaster ($120) and digital scales ($60), $600 + GST in total, paid on the business debit card.\n\nEach costs under $1,000 (excl GST), so NZ tax rules let the café write them off immediately as [[low-value-asset]]s instead of depreciating them over years. Most small businesses do the same in their accounts to keep things simple.",
    doc: supplierInvoice("appliance", "KB-7710", "2026-04-06", [
      { desc: "Commercial blender", qty: 1, unit: 420, amount: 420 },
      { desc: "4-slice commercial toaster", qty: 1, unit: 120, amount: 120 },
      { desc: "Digital kitchen scales", qty: 1, unit: 60, amount: 60 },
    ], { paid: "PAID – EFTPOS 6/4/26", title: "Tax Invoice / Receipt" }),
    lines: buyLines("625", 690, "100", { memo: "Blender, toaster, scales", why: "Expensed straight away under the low-value asset rule. Expenses go up with a debit.", creditWhy: "Debit card payment, straight out of the bank." }),
    gstNote: "GST claimed as normal ($90).",
    deepDives: [{ href: "/nz/depreciation", label: "The $1,000 low-value asset rule" }],
  },
  {
    id: "A09",
    date: "2026-04-07",
    title: "Buy the POS system and laptop",
    kind: "featured",
    book: "cash-payments",
    story: "A point-of-sale (POS) terminal, receipt printer and a laptop for the books: $2,000 + GST. Together they're over $1,000, so they're capitalised as computer equipment.",
    doc: supplierInvoice("tech", "TT-3381", "2026-04-07", [
      { desc: "POS touchscreen terminal", qty: 1, unit: 1_100, amount: 1_100 },
      { desc: "Thermal receipt printer + cash drawer", qty: 1, unit: 300, amount: 300 },
      { desc: "Laptop", qty: 1, unit: 600, amount: 600 },
    ], { paid: "PAID 7/4/26" }),
    lines: buyLines("175", 2_300, "100", { memo: "POS & computer", why: "Fixed asset at cost excl GST.", creditWhy: "Paid from the bank." }),
  },
  {
    id: "A10",
    date: "2026-04-08",
    title: "Pay six months' insurance",
    kind: "featured",
    book: "cash-payments",
    story:
      "Business insurance (contents, business interruption, public liability) for April–September: $1,200 + GST.\n\nWhy expense it straight away, when rent paid in advance went to an asset? The whole policy period falls inside this financial year, so by 31 March it will all be used up. Recording it as an expense now gives the same year-end result with less work. (Compare transaction F07 in October, where part of the policy runs past year end.)",
    doc: supplierInvoice("insurer", "POL-88812", "2026-04-08", [
      { desc: "Business package policy 8 Apr – 7 Oct 2026", qty: 1, unit: 1_200, amount: 1_200 },
    ], { paid: "PAID 8/4/26", title: "Tax Invoice – Insurance Premium" }),
    lines: buyLines("613", 1_380, "100", { memo: "Insurance Apr–Sep", why: "An expense: it's used up within this year.", creditWhy: "Paid from the bank." }),
    gstNote: "General insurance includes GST, which is claimable. Life insurance would be exempt (no GST).",
  },
  {
    id: "A11",
    date: "2026-04-08",
    title: "Register the food business with the council",
    kind: "featured",
    book: "cash-payments",
    story: "Every NZ café needs a registered Food Control Plan under the Food Act 2014. The council charges $450 + GST for registration and the first verification visit.",
    doc: supplierInvoice("council", "FCP-26-0912", "2026-04-08", [
      { desc: "Food Control Plan registration", qty: 1, unit: 250, amount: 250 },
      { desc: "Initial verification visit", qty: 1, unit: 200, amount: 200 },
    ], { paid: "PAID 8/4/26" }),
    lines: buyLines("620", 517.5, "100", { memo: "Food control plan", why: "A cost of running the business = expense (debit).", creditWhy: "Paid from the bank." }),
  },
  {
    id: "A12",
    date: "2026-04-08",
    title: "Buy coffee beans on credit",
    kind: "featured",
    book: "purchases",
    story:
      "Southern Roasters delivers the first 50 kg of beans with an invoice for $2,000 + GST, payable on the 20th of next month.\n\nNo money moves today, but the café now OWES the roaster. That debt is [[accounts-payable]] (creditors), a liability. The café uses a [[periodic-inventory]] system: stock bought for resale goes into 'Purchases' accounts, and a stocktake at year end works out how much is still on the shelf.",
    doc: supplierInvoice("roaster", "SR-40021", "2026-04-08", [
      { desc: "Kōwhai House Blend – 1kg bags", qty: 40, unit: 38, amount: 1_520 },
      { desc: "Single origin Ethiopia – 1kg bags", qty: 10, unit: 48, amount: 480 },
    ]),
    lines: buyLines("510", 2_300, "200", { party: SUPPLIERS.roaster.name, memo: "Coffee beans", why: "Purchases of stock are a cost of sales (expense). Debit.", creditWhy: "The café owes the supplier: accounts payable (liability) goes up = credit." }),
    gstNote: "Invoice basis: the café claims GST when it holds the invoice, even though it hasn't paid yet.",
    quiz: {
      q: "No cash has moved. Why do we record anything?",
      options: ["We don't. Wait until it's paid", "The café has received goods and owes money. That's a real change to its position", "Only because of GST"],
      answer: 1,
      explain: "Under accrual accounting a transaction is recorded when it happens (goods received / obligation created), not when cash moves.",
    },
  },
  {
    id: "A13",
    date: "2026-04-09",
    title: "Buy food stock on credit",
    kind: "featured",
    book: "purchases",
    story: "Fresh Fields Wholesale delivers flour, eggs, bacon, bread and cabinet ingredients: $1,500 + GST, on account.",
    doc: supplierInvoice("food", "FF-118340", "2026-04-09", [
      { desc: "Free-range eggs (30 doz)", qty: 30, unit: 9, amount: 270 },
      { desc: "Sourdough loaves", qty: 60, unit: 5.5, amount: 330 },
      { desc: "Streaky bacon 5kg", qty: 6, unit: 55, amount: 330 },
      { desc: "Baking supplies (flour, sugar, butter)", qty: 1, unit: 570, amount: 570 },
    ]),
    lines: buyLines("511", 1_725, "200", { party: SUPPLIERS.food.name, memo: "Food stock", why: "Cost of sales (expense) up = debit.", creditWhy: "Owed to Fresh Fields = liability up = credit." }),
  },
  {
    id: "A14",
    date: "2026-04-09",
    title: "Buy milk on credit",
    kind: "featured",
    book: "purchases",
    story: "Valley Dairy delivers milk and cream: $400 + GST on the dairy account.",
    doc: supplierInvoice("dairy", "VD-99120", "2026-04-09", [
      { desc: "Blue top milk 2L", qty: 120, unit: 2.5, amount: 300 },
      { desc: "Oat milk 1L (barista)", qty: 20, unit: 3.5, amount: 70 },
      { desc: "Cream 1L", qty: 6, unit: 5, amount: 30 },
    ]),
    lines: buyLines("512", 460, "200", { party: SUPPLIERS.dairy.name, memo: "Milk & dairy", why: "Cost of sales (expense) up = debit.", creditWhy: "Owed to Valley Dairy = credit." }),
  },
  {
    id: "A15",
    date: "2026-04-09",
    title: "Accountant's invoice for setting up the company",
    kind: "featured",
    book: "purchases",
    story: "Rata & Co set up the company, GST registration, payroll and the chart of accounts: $1,200 + GST, payable by the 20th of next month.",
    doc: supplierInvoice("accountant", "RC-2026-118", "2026-04-09", [
      { desc: "Company incorporation & share register", qty: 1, unit: 400, amount: 400 },
      { desc: "IRD registrations (GST, employer)", qty: 1, unit: 300, amount: 300 },
      { desc: "Accounting system set-up & training", qty: 1, unit: 500, amount: 500 },
    ]),
    lines: buyLines("618", 1_380, "200", { party: SUPPLIERS.accountant.name, memo: "Set-up fees", why: "Professional fees are an expense.", creditWhy: "Owed to Rata & Co (accounts payable)." }),
  },
  {
    id: "A16",
    date: "2026-04-10",
    title: "Put a $300 float in the till",
    kind: "featured",
    book: "cash-payments",
    story:
      "Before opening, Aroha withdraws $300 in notes and coins so the till can give change. This is a [[float]]. Money moves from one asset (bank) to another (cash on hand). Nothing is earned or spent.",
    doc: { kind: "bank-transfer", title: "Cash withdrawal", issuer: BUSINESS.bank, date: "2026-04-10", rows: [{ label: "Withdrawal – change order", value: "$300.00", strong: true }, { label: "Denominations", value: "$5 ×20, $10 ×6, $20 ×4, coins $60" }] },
    lines: [
      { account: "105", debit: 300, why: "Cash in the till (an asset) goes up." },
      { account: "100", credit: 300, why: "Bank (an asset) goes down." },
    ],
  },
  {
    id: "A17",
    date: "2026-04-16",
    title: "First week of sales (Z-report)",
    kind: "featured",
    book: "sales",
    story:
      `Opening week! The café sells ${money2(wk1Incl)} of coffee and food. A café doesn't record every flat white separately in the accounts. The POS keeps the detail, and at the end of each day (or week) a [[z-report]] gives the totals.\n\nPrices on the menu INCLUDE GST, so part of every sale belongs to IRD: ${money2(wk1Incl)} × 3/23 = ${money2(gstOf(wk1Incl))}. The café's real [[revenue]] is the GST-exclusive amount.\n\nCustomers paid ${money2(wk1Eftpos)} by card/EFTPOS and ${money2(wk1Cash)} in cash. Card money doesn't reach the bank for a day or two, so it sits in [[eftpos-clearing]].`,
    doc: {
      kind: "z-report",
      title: "Z-REPORT  Week 10–16 Apr 2026",
      issuer: BUSINESS.tradingAs,
      ref: "Z-0001 to Z-0007",
      date: "2026-04-16",
      rows: [
        { label: "Transactions", value: "1,412" },
        { label: "Coffee & drinks", value: money2(4_140) },
        { label: "Food", value: money2(wk1Incl - 4_140) },
        { label: "GROSS SALES (incl GST)", value: money2(wk1Incl), strong: true },
        { label: "GST content (3/23)", value: money2(gstOf(wk1Incl)) },
        { label: "EFTPOS / card", value: money2(wk1Eftpos) },
        { label: "Cash", value: money2(wk1Cash) },
      ],
      footer: ["Totals for the week from the POS. Each customer got a receipt; receipts under $200 don't need the buyer's details."],
    },
    lines: [
      { account: "110", debit: wk1Eftpos, memo: "Card sales awaiting settlement", why: "The bank owes the café this card money: an asset going up." },
      { account: "105", debit: wk1Cash, memo: "Cash takings", why: "Cash in the till goes up." },
      { account: "400", credit: APRIL_WEEK1_EX, memo: "Sales excl GST", why: "Income has been earned. Income goes up with a credit." },
      { account: "210", credit: gstOf(wk1Incl), gst: "output", memo: "GST on sales (3/23)", why: "GST collected for IRD. It's owed to IRD, so the liability goes up (credit)." },
    ],
    gstNote: "To get the GST out of a GST-inclusive price, multiply by 3/23 (not 15%!). $115 × 3/23 = $15.",
    deepDives: [{ href: "/nz/gst", label: "GST: how it works for a café" }],
    quiz: {
      q: "A customer pays $5.75 for a flat white. How much is GST?",
      options: ["$0.86", "$0.75", "$0.58"],
      answer: 1,
      explain: "$5.75 × 3/23 = $0.75. ($5.00 + 15% = $5.75.) Using 15% of $5.75 ($0.86) is a classic mistake.",
    },
  },
  {
    id: "A18",
    date: "2026-04-17",
    title: "Bank pays out the week's card sales, minus fees",
    kind: "featured",
    book: "cash-receipts",
    story: `The bank deposits the card sales but keeps ${money2(wk1Fee)} as [[merchant-fees]] (about 0.9% for contactless/credit cards). The EFTPOS clearing account is emptied: the 'money in the pipe' has arrived.`,
    doc: {
      kind: "eftpos-settlement",
      title: "Merchant Settlement Statement",
      issuer: BUSINESS.bank + " Merchant Services",
      recipient: BUSINESS.name,
      date: "2026-04-17",
      rows: [
        { label: "Card sales 10–16 Apr", value: money2(wk1Eftpos) },
        { label: "Merchant service fees", value: "−" + money2(wk1Fee) },
        { label: "Net settled to account", value: money2(wk1Eftpos - wk1Fee), strong: true },
      ],
      footer: ["Merchant fees are a financial service, so they're GST-exempt."],
    },
    lines: [
      { account: "100", debit: r2(wk1Eftpos - wk1Fee), why: "Money arrives in the bank." },
      { account: "622", debit: wk1Fee, why: "The bank's fee is a cost of doing business (expense)." },
      { account: "110", credit: wk1Eftpos, why: "Clearing account emptied. The asset goes down (credit)." },
    ],
    gstNote: "No GST on merchant fees (exempt financial service). So there's nothing to claim.",
  },
  {
    id: "A19",
    date: "2026-04-17",
    title: "Bank the week's cash",
    kind: "featured",
    book: "cash-receipts",
    story: `Aroha counts the till: ${money2(wk1Cash + 300)}. She leaves the $300 float and deposits ${money2(wk1Cash)}. Again, just one asset swapping for another.`,
    doc: { kind: "deposit-slip", title: "Deposit Slip", issuer: BUSINESS.bank, recipient: BUSINESS.name, date: "2026-04-17", rows: [{ label: "Notes", value: money2(wk1Cash - 80) }, { label: "Coins", value: "$80.00" }, { label: "Total deposited", value: money2(wk1Cash), strong: true }] },
    lines: [
      { account: "100", debit: wk1Cash, why: "Bank goes up." },
      { account: "105", credit: wk1Cash, why: "Cash in the till goes down (back to the $300 float)." },
    ],
  },
  {
    id: "A20",
    date: "2026-04-18",
    title: "Invoice a catering job on credit",
    kind: "featured",
    book: "sales",
    story:
      "Tūī Consulting orders platters and coffee for a 40-person workshop: $1,000 + GST. The café delivers today and sends a tax invoice due on the 20th of next month.\n\nThe café has EARNED the income today, even though the cash comes later. So income is recorded now, together with an [[accounts-receivable]] asset (a debtor).",
    doc: salesInvoice("tui", "INV-0001", "2026-04-18", [
      { desc: "Breakfast platters (serves 10)", qty: 4, unit: 140, amount: 560 },
      { desc: "Barista coffee service – 40 cups", qty: 40, unit: 8, amount: 320 },
      { desc: "Delivery & setup", qty: 1, unit: 120, amount: 120 },
    ]),
    lines: [
      { account: "120", debit: 1_150, party: CUSTOMERS.tui.name, why: "Tūī owes the café $1,150. Debtors are an asset, so a debit." },
      { account: "410", credit: 1_000, why: "Income earned (excl GST). Income up = credit." },
      { account: "210", credit: 150, gst: "output", why: "GST is charged on the invoice and owed to IRD." },
    ],
    gstNote: "Invoice basis: the GST goes in this period's GST return even though Tūī hasn't paid yet.",
    deepDives: [{ href: "/nz/gst", label: "What must be on a tax invoice (taxable supply information)" }],
  },
  {
    id: "A22",
    date: "2026-04-24",
    title: "Take a potential catering client to lunch",
    kind: "featured",
    book: "cash-payments",
    story:
      "Aroha takes the office manager of a law firm to lunch at another restaurant to pitch Christmas catering: $80 + GST, on the business card.\n\nThis is [[entertainment]]. In NZ, food and drink with a social element are generally only 50% tax-deductible. The accounts record the full cost now; the 50% limit is dealt with at year end (in the tax calculation and with a GST adjustment).",
    doc: { kind: "receipt", title: "Tax Invoice / Receipt", issuer: "The Wharf Kitchen", date: "2026-04-24", items: [{ desc: "2 × lunch special", amount: 70 }, { desc: "2 × sparkling water", amount: 10 }], totals: [{ label: "Total incl GST", value: "$92.00", strong: true }, { label: "Includes GST of", value: "$12.00" }], footer: ["Under $200: a simple receipt is enough for the GST claim."] },
    lines: buyLines("623", 92, "100", { memo: "Client lunch", why: "Entertainment expense, recorded at full cost.", creditWhy: "Card payment from the bank." }),
    deepDives: [{ href: "/nz/income-tax", label: "Entertainment: the 50% rule" }],
  },
  {
    id: "A23",
    date: "2026-04-28",
    title: "April power bill arrives",
    kind: "featured",
    book: "purchases",
    story: "Kahu Energy's bill for April: $500 + GST, due on the 20th of May. Expense now (April's power was used in April), paid later.",
    doc: supplierInvoice("power", "KE-55120-04", "2026-04-28", [
      { desc: "Electricity 1–28 Apr: 1,950 kWh", qty: 1, unit: 420, amount: 420 },
      { desc: "Daily fixed charge", qty: 28, unit: 2.857142857, amount: 80 },
    ]),
    lines: buyLines("611", 575, "200", { party: SUPPLIERS.power.name, memo: "Power – April", why: "An expense used in April.", creditWhy: "Owed to Kahu Energy." }),
  },
  {
    id: "A24",
    date: "2026-04-30",
    title: "Rest of April sales (17–30 Apr)",
    kind: "featured",
    book: "sales",
    story: `The daily Z-reports for 17–30 April add up to ${money2(restIncl)} incl GST. It's the same entry as week one, just bigger.`,
    doc: {
      kind: "z-report",
      title: "Z-REPORT SUMMARY 17–30 Apr 2026",
      issuer: BUSINESS.tradingAs,
      ref: "Z-0008 to Z-0021",
      date: "2026-04-30",
      rows: [
        { label: "GROSS SALES (incl GST)", value: money2(restIncl), strong: true },
        { label: "GST content (3/23)", value: money2(gstOf(restIncl)) },
        { label: "EFTPOS / card", value: money2(restEftpos) },
        { label: "Cash", value: money2(restCash) },
      ],
    },
    lines: [
      { account: "110", debit: restEftpos, why: "Card sales awaiting settlement." },
      { account: "105", debit: restCash, why: "Cash takings." },
      { account: "400", credit: APRIL_REST_EX, why: "Sales income excl GST." },
      { account: "210", credit: gstOf(restIncl), gst: "output", why: "GST on sales owed to IRD." },
    ],
  },
  {
    id: "A25",
    date: "2026-04-30",
    title: "Card settlements and cash banked (17–30 Apr)",
    kind: "featured",
    book: "cash-receipts",
    story: "All card sales for the period are settled into the bank (less fees), and the cash takings are banked, leaving the $300 float.",
    doc: {
      kind: "bank-statement",
      title: "Bank statement extract",
      issuer: BUSINESS.bank,
      recipient: BUSINESS.name,
      date: "2026-04-30",
      rows: [
        { label: "Merchant settlements (14 days)", value: money2(restEftpos - restFee) },
        { label: "Cash deposits", value: money2(restCash) },
      ],
    },
    lines: [
      { account: "100", debit: r2(restEftpos - restFee + restCash), why: "Card money and cash arrive in the bank." },
      { account: "622", debit: restFee, why: "Merchant fees (exempt, no GST)." },
      { account: "110", credit: restEftpos, why: "EFTPOS clearing emptied." },
      { account: "105", credit: restCash, why: "Till back to the $300 float." },
    ],
  },
  {
    id: "A26",
    date: "2026-04-30",
    title: "Month-end supplier statements",
    kind: "featured",
    book: "purchases",
    story:
      "Throughout April the café got more deliveries of beans, food, milk and takeaway cups. Each delivery came with an invoice, and here they're summarised from the month-end supplier statements. They're all on credit, due on 20 May.",
    doc: {
      kind: "internal",
      title: "Purchases journal summary – April",
      issuer: BUSINESS.name,
      date: "2026-04-30",
      rows: [
        { label: SUPPLIERS.roaster.name, value: money2(incl(aprPurch.coffee)) },
        { label: SUPPLIERS.food.name, value: money2(incl(aprPurch.food)) },
        { label: SUPPLIERS.dairy.name, value: money2(incl(aprPurch.dairy)) },
        { label: SUPPLIERS.packaging.name, value: money2(incl(aprPurch.packaging)) },
      ],
    },
    lines: [
      { account: "510", debit: aprPurch.coffee, why: "Coffee purchases (excl GST)." },
      { account: "511", debit: aprPurch.food, why: "Food purchases." },
      { account: "512", debit: aprPurch.dairy, why: "Milk & dairy." },
      { account: "513", debit: aprPurch.packaging, why: "Cups, lids & bags." },
      { account: "210", debit: r2((aprPurch.coffee + aprPurch.food + aprPurch.dairy + aprPurch.packaging) * 0.15), gst: "input", why: "GST on all those invoices is claimable." },
      { account: "200", credit: incl(aprPurch.coffee), party: SUPPLIERS.roaster.name, why: "Owed to each supplier." },
      { account: "200", credit: incl(aprPurch.food), party: SUPPLIERS.food.name },
      { account: "200", credit: incl(aprPurch.dairy), party: SUPPLIERS.dairy.name },
      { account: "200", credit: incl(aprPurch.packaging), party: SUPPLIERS.packaging.name },
    ],
    notes: ["A [[compound-entry]] has more than two lines, but total debits still equal total credits."],
  },
  {
    id: "A27",
    date: "2026-04-30",
    title: "April's rent is used up",
    kind: "featured",
    book: "general",
    story:
      "At the end of April, one of the three prepaid months has been used. $3,000 moves from the Prepaid rent asset to Rent expense. No cash moves; this is a [[general-journal]] entry made to follow the accrual principle.",
    doc: { kind: "internal", title: "Journal voucher JV-0001", issuer: BUSINESS.name, date: "2026-04-30", rows: [{ label: "Reason", value: "Release 1 of 3 months prepaid rent" }, { label: "Amount", value: "$3,000.00", strong: true }] },
    lines: [
      { account: "610", debit: 3_000, why: "April's rent becomes an expense." },
      { account: "135", credit: 3_000, why: "The prepaid asset shrinks: 2 months left." },
    ],
  },
  {
    id: "A28",
    date: "2026-04-30",
    title: "First loan repayment",
    kind: "featured",
    book: "cash-payments",
    story: `The bank takes ${money2(loan.payment)}. Only part of it is an expense: ${money2(loan.rows[0].interest)} is [[interest]] (the cost of borrowing), and ${money2(loan.rows[0].principal)} pays down the loan.\n\nNew bookkeepers often put the whole repayment to expenses. That overstates expenses and leaves the loan too high on the balance sheet.`,
    doc: { kind: "bank-statement", title: "Loan statement", issuer: LOAN.lender, recipient: BUSINESS.name, date: "2026-04-30", rows: [{ label: "Opening balance", value: "$50,000.00" }, { label: "Interest charged (8.5% ÷ 12)", value: money2(loan.rows[0].interest) }, { label: "Repayment", value: "−" + money2(loan.payment) }, { label: "Closing balance", value: money2(loan.rows[0].closing), strong: true }] },
    lines: [
      { account: "630", debit: loan.rows[0].interest, why: "Interest is the cost of borrowing: an expense." },
      { account: "250", debit: loan.rows[0].principal, why: "Paying back principal reduces the liability (debit)." },
      { account: "100", credit: loan.payment, why: "Total payment out of the bank." },
    ],
    quiz: {
      q: "Which part of a loan repayment is an expense?",
      options: ["All of it", "Only the interest", "Only the principal"],
      answer: 1,
      explain: "Principal repayments just reduce what you owe. Interest is the cost of using the bank's money.",
    },
  },
  {
    id: "A29",
    date: "2026-04-30",
    title: "Aroha and Ben take drawings",
    kind: "featured",
    book: "cash-payments",
    story:
      "Aroha and Ben need money to live on. The company pays Aroha $3,500 and Ben $2,000.\n\nThese are NOT wages: shareholders who work in their own company usually don't go through PAYE. The payments are [[drawings]], charged to each person's [[shareholder-current-account]]. At year end the accountant gives them a [[shareholder-salary]] that is credited to the same accounts, and they pay tax on it personally (IR3, provisional tax).",
    doc: { kind: "bank-transfer", title: "Online transfers", issuer: BUSINESS.bank, date: "2026-04-30", rows: [{ label: "To A Ngata – drawings", value: "$3,500.00" }, { label: "To B Fraser – drawings", value: "$2,000.00" }] },
    lines: [
      { account: "240", debit: 3_500, party: "Aroha Ngata", why: "Reduces what the company owes Aroha (or creates an amount she owes the company)." },
      { account: "241", debit: 2_000, party: "Ben Fraser", why: "Same for Ben." },
      { account: "100", credit: 5_500, why: "Paid from the bank." },
    ],
    notes: [
      "If a current account stays overdrawn (the shareholder owes the company) the company should charge interest at IRD's prescribed rate. If it charges less, the shortfall is taxed as a fringe benefit (for a shareholder-employee) or as a dividend.",
    ],
    deepDives: [{ href: "/nz/shareholders", label: "Shareholder salaries & current accounts" }],
  },
];

export const APRIL_SALES_EX = APRIL_WEEK1_EX + APRIL_REST_EX;
export const APRIL_PURCHASE_TOTALS = {
  coffee: 3_348,
  food: 5_952,
  dairy: 1_488,
  packaging: 744,
};
export { loan as LOAN_SCHEDULE };


