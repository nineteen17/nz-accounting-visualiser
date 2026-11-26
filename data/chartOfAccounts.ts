import type { Account, AccountType, CashFlowTag, GstTreatment, Subtype } from "@/lib/engine/types";

function acc(
  code: string,
  name: string,
  type: AccountType,
  subtype: Subtype,
  gst: GstTreatment,
  cf: CashFlowTag,
  description: string,
  extra: Partial<Account> = {},
): Account {
  const normal = type === "asset" || type === "expense" ? "debit" : "credit";
  return {
    code,
    name,
    type,
    subtype,
    gst,
    cf,
    description,
    normal: extra.contra ? (normal === "debit" ? "credit" : "debit") : normal,
    temporary: type === "income" || type === "expense",
    ...extra,
  };
}

export const ACCOUNTS: Account[] = [
  // ───────────── ASSETS (things the café owns or is owed) ─────────────
  acc("100", "Bank – cheque account", "asset", "current-asset", "none", "cash",
    "The café's everyday business bank account. Every payment in or out of the bank goes through here.", { group: "Cash and bank" }),
  acc("105", "Cash on hand (till)", "asset", "current-asset", "none", "cash",
    "Physical notes and coins in the till, including the $300 float kept for giving change.", { group: "Cash and bank" }),
  acc("110", "EFTPOS clearing", "asset", "current-asset", "none", "customers",
    "Card sales the bank hasn't paid into the account yet. Customers have paid, but the money is 'in the pipe' for 1–2 days.", { group: "Receivables" }),
  acc("115", "Term deposit", "asset", "current-asset", "none", "investments",
    "Spare cash locked away at the bank for a fixed term to earn interest.", { group: "Cash and bank" }),
  acc("120", "Accounts receivable (debtors)", "asset", "current-asset", "none", "customers",
    "Money customers owe the café for invoices it has sent but not yet been paid for (catering jobs).", { group: "Receivables" }),
  acc("125", "Accrued income", "asset", "current-asset", "none", "customers",
    "Income the café has earned but hasn't invoiced yet at balance date.", { group: "Receivables" }),
  acc("130", "Inventory (stock on hand)", "asset", "current-asset", "none", "suppliers",
    "Coffee beans, food, milk and packaging on the shelves, valued at cost. Updated by stocktake at year end.", { group: "Inventory" }),
  acc("135", "Prepaid rent", "asset", "current-asset", "none", "suppliers",
    "Rent paid in advance for months not yet used. It's an asset because the café is owed future use of the premises.", { group: "Prepayments" }),
  acc("136", "Prepaid insurance", "asset", "current-asset", "none", "suppliers",
    "The unused part of an insurance premium paid in advance.", { group: "Prepayments" }),
  acc("140", "RWT credits", "asset", "current-asset", "none", "income-tax",
    "Resident withholding tax the bank deducted from interest. It's income tax already paid on the café's behalf, so it's an asset until used against the tax bill.", { group: "Tax assets" }),
  acc("141", "Provisional tax paid", "asset", "current-asset", "none", "income-tax",
    "Income tax paid to IRD in advance during the year. Used against the final tax bill.", { group: "Tax assets" }),
  acc("150", "Lease bond", "asset", "non-current-asset", "none", "investments",
    "Bond held by the landlord. The café gets it back when the lease ends, so it's an asset.", { group: "Other non-current assets" }),
  acc("160", "Plant & equipment – cost", "asset", "non-current-asset", "none", "ppe",
    "What the café paid (excl GST) for the espresso machine and kitchen equipment.", { group: "Property, plant & equipment" }),
  acc("161", "Plant & equipment – accumulated depreciation", "asset", "non-current-asset", "none", "none",
    "Total depreciation charged so far on plant & equipment. A contra account: it reduces the asset.", { group: "Property, plant & equipment", contra: true }),
  acc("165", "Café fit-out – cost", "asset", "non-current-asset", "none", "ppe",
    "Counters, shelving, lighting and joinery built into the leased shop.", { group: "Property, plant & equipment" }),
  acc("166", "Café fit-out – accumulated depreciation", "asset", "non-current-asset", "none", "none",
    "Total depreciation charged so far on the fit-out (contra asset).", { group: "Property, plant & equipment", contra: true }),
  acc("170", "Furniture & fittings – cost", "asset", "non-current-asset", "none", "ppe",
    "Tables, chairs and outdoor furniture.", { group: "Property, plant & equipment" }),
  acc("171", "Furniture & fittings – accumulated depreciation", "asset", "non-current-asset", "none", "none",
    "Total depreciation charged so far on furniture (contra asset).", { group: "Property, plant & equipment", contra: true }),
  acc("175", "Computer equipment – cost", "asset", "non-current-asset", "none", "ppe",
    "POS terminal, laptop and receipt printer.", { group: "Property, plant & equipment" }),
  acc("176", "Computer equipment – accumulated depreciation", "asset", "non-current-asset", "none", "none",
    "Total depreciation charged so far on computers (contra asset).", { group: "Property, plant & equipment", contra: true }),

  // ───────────── LIABILITIES (what the café owes) ─────────────
  acc("200", "Accounts payable (creditors)", "liability", "current-liability", "none", "suppliers",
    "Bills from suppliers the café has received but not yet paid.", { group: "Payables" }),
  acc("205", "Accrued expenses", "liability", "current-liability", "none", "suppliers",
    "Costs used up before balance date where the bill hasn't arrived yet (e.g. March power).", { group: "Payables" }),
  acc("206", "Accrued wages", "liability", "current-liability", "none", "employees",
    "Wages staff have earned up to balance date that will be paid in the next pay run.", { group: "Employee liabilities" }),
  acc("210", "GST", "liability", "current-liability", "none", "gst",
    "The GST control account. GST on sales is added (credit); GST on purchases is subtracted (debit). The balance is what the café owes IRD (or is owed back).", { group: "Tax liabilities" }),
  acc("215", "PAYE & payroll deductions payable", "liability", "current-liability", "none", "employees",
    "PAYE, student loan, KiwiSaver and ESCT deducted from pay runs that must be paid to IRD by the 20th of the next month.", { group: "Employee liabilities" }),
  acc("220", "Holiday pay accrual", "liability", "current-liability", "none", "employees",
    "Annual leave staff have earned but not yet taken. The café owes it to them.", { group: "Employee liabilities" }),
  acc("225", "Income in advance", "liability", "current-liability", "none", "customers",
    "Deposits from customers for catering the café hasn't done yet. It owes them the service (or the money back).", { group: "Payables" }),
  acc("230", "Income tax payable", "liability", "current-liability", "none", "income-tax",
    "Company income tax owed to IRD for the year.", { group: "Tax liabilities" }),
  acc("240", "Shareholder current account – Aroha", "liability", "current-liability", "none", "shareholders",
    "Running account between the company and Aroha. Credits = company owes her (e.g. her salary). Debits = money she's taken out (drawings).", { group: "Shareholder current accounts" }),
  acc("241", "Shareholder current account – Ben", "liability", "current-liability", "none", "shareholders",
    "Running account between the company and Ben. Credits = company owes him. Debits = drawings.", { group: "Shareholder current accounts" }),
  acc("250", "Bank loan", "liability", "non-current-liability", "none", "borrowings",
    "Five-year loan from Harbour Bank used to buy the espresso machine and fit-out.", { group: "Borrowings" }),

  // ───────────── EQUITY (owners' stake) ─────────────
  acc("300", "Share capital", "equity", "equity", "none", "shares",
    "Money the shareholders put in to buy shares in the company.", { group: "Equity" }),
  acc("310", "Retained earnings", "equity", "equity", "none", "none",
    "All profits the company has made (after tax) and kept, less any dividends paid.", { group: "Equity" }),
  acc("320", "Income summary", "equity", "equity", "none", "none",
    "A temporary 'funnel' used only during closing: all income and expenses are emptied into it, and the result (profit) is moved to retained earnings.", { group: "Equity", temporary: true }),

  // ───────────── INCOME ─────────────
  acc("400", "Café sales", "income", "revenue", "standard", "customers",
    "Coffee, food and drinks sold over the counter (GST-exclusive).", { group: "Revenue" }),
  acc("410", "Catering sales", "income", "revenue", "standard", "customers",
    "Catering jobs for businesses and events (GST-exclusive).", { group: "Revenue" }),
  acc("450", "Interest income", "income", "other-income", "exempt", "interest-received",
    "Interest earned on the term deposit. Financial services are GST-exempt.", { group: "Other income" }),

  // ───────────── COST OF SALES ─────────────
  acc("510", "Purchases – coffee beans", "expense", "cost-of-sales", "standard", "suppliers",
    "Coffee beans bought for resale (periodic inventory system).", { group: "Cost of sales" }),
  acc("511", "Purchases – food", "expense", "cost-of-sales", "standard", "suppliers",
    "Food ingredients: bread, eggs, bacon, cabinet food ingredients, baking supplies.", { group: "Cost of sales" }),
  acc("512", "Purchases – milk & dairy", "expense", "cost-of-sales", "standard", "suppliers",
    "Milk, plant milks, cream, butter.", { group: "Cost of sales" }),
  acc("513", "Purchases – packaging", "expense", "cost-of-sales", "standard", "suppliers",
    "Takeaway cups, lids, bags and napkins.", { group: "Cost of sales" }),
  acc("519", "Stock movement (opening – closing)", "expense", "cost-of-sales", "none", "suppliers",
    "Year-end adjustment that turns 'purchases' into 'cost of goods sold' by taking out stock still on the shelf.", { group: "Cost of sales" }),

  // ───────────── EXPENSES ─────────────
  acc("600", "Wages", "expense", "operating-expense", "none", "employees",
    "Gross wages of employees (before PAYE and other deductions).", { group: "Employment costs" }),
  acc("601", "KiwiSaver employer contributions", "expense", "operating-expense", "none", "employees",
    "The café's compulsory 3.5% KiwiSaver contribution for employees (gross, before ESCT).", { group: "Employment costs" }),
  acc("602", "Holiday pay expense", "expense", "operating-expense", "none", "employees",
    "Annual leave earned by staff during the year (accrued at year end).", { group: "Employment costs" }),
  acc("605", "Shareholder salaries", "expense", "operating-expense", "none", "shareholders",
    "Salaries allocated to working shareholders at year end. No PAYE – they pay their own tax.", { group: "Employment costs" }),
  acc("610", "Rent", "expense", "operating-expense", "standard", "suppliers", "Rent for the café premises.", { group: "Premises" }),
  acc("611", "Power & gas", "expense", "operating-expense", "standard", "suppliers", "Electricity and gas.", { group: "Premises" }),
  acc("612", "Internet & phone", "expense", "operating-expense", "standard", "suppliers", "Broadband and mobile.", { group: "Administration" }),
  acc("613", "Insurance", "expense", "operating-expense", "standard", "suppliers", "Business, contents and liability insurance.", { group: "Premises" }),
  acc("614", "Cleaning & hygiene", "expense", "operating-expense", "standard", "suppliers", "Cleaning products and supplies.", { group: "Premises" }),
  acc("615", "Rubbish & recycling", "expense", "operating-expense", "standard", "suppliers", "Waste and recycling collection.", { group: "Premises" }),
  acc("616", "Repairs & maintenance", "expense", "operating-expense", "standard", "suppliers", "Fixing equipment and premises.", { group: "Premises" }),
  acc("617", "Advertising & marketing", "expense", "operating-expense", "standard", "suppliers", "Social media ads, signage, flyers.", { group: "Administration" }),
  acc("618", "Accounting & legal fees", "expense", "operating-expense", "standard", "suppliers", "Accountant and lawyer fees.", { group: "Administration" }),
  acc("619", "Software subscriptions", "expense", "operating-expense", "standard", "suppliers", "Cloud accounting and POS software.", { group: "Administration" }),
  acc("620", "Licences & council fees", "expense", "operating-expense", "standard", "suppliers", "Food control plan registration and verification with the council.", { group: "Administration" }),
  acc("621", "Bank fees", "expense", "operating-expense", "exempt", "suppliers", "Monthly account fees (GST-exempt financial service).", { group: "Administration" }),
  acc("622", "Merchant fees", "expense", "operating-expense", "exempt", "suppliers", "Fees the bank charges on card payments (GST-exempt).", { group: "Administration" }),
  acc("623", "Entertainment", "expense", "operating-expense", "standard", "suppliers", "Client hospitality and the staff Christmas function. Only 50% is tax-deductible.", { group: "Administration" }),
  acc("624", "Bad debts", "expense", "operating-expense", "none", "customers", "Customer invoices written off as uncollectable.", { group: "Administration" }),
  acc("625", "Low-value assets written off", "expense", "operating-expense", "standard", "suppliers", "Equipment costing $1,000 or less (excl GST), expensed straight away.", { group: "Administration" }),
  acc("626", "Depreciation", "expense", "operating-expense", "none", "none", "The part of fixed assets' cost used up this year.", { group: "Depreciation" }),
  acc("630", "Interest expense", "expense", "finance-cost", "exempt", "interest-paid", "Interest charged on the bank loan.", { group: "Finance costs" }),
  acc("690", "Income tax expense", "expense", "tax-expense", "none", "income-tax", "Company income tax on this year's profit (28%).", { group: "Income tax" }),
];

export const ACCOUNT_MAP: Record<string, Account> = Object.fromEntries(ACCOUNTS.map((a) => [a.code, a]));

export function account(code: string): Account {
  const a = ACCOUNT_MAP[code];
  if (!a) throw new Error(`Unknown account ${code}`);
  return a;
}

export const TYPE_LABEL: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  income: "Income",
  expense: "Expense",
};
