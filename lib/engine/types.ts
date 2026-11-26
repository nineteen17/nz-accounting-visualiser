export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
export type Side = "debit" | "credit";

export type Subtype =
  | "current-asset"
  | "non-current-asset"
  | "current-liability"
  | "non-current-liability"
  | "equity"
  | "revenue"
  | "other-income"
  | "cost-of-sales"
  | "operating-expense"
  | "finance-cost"
  | "tax-expense";

/** How a line affecting this account is shown in a direct-method cash flow statement */
export type CashFlowTag =
  | "cash"
  | "customers"
  | "suppliers"
  | "employees"
  | "interest-received"
  | "interest-paid"
  | "income-tax"
  | "gst"
  | "ppe"
  | "investments"
  | "shares"
  | "borrowings"
  | "shareholders"
  | "none";

export type GstTreatment = "standard" | "zero" | "exempt" | "none";

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  subtype: Subtype;
  /** the side that makes this account go UP */
  normal: Side;
  gst: GstTreatment;
  cf: CashFlowTag;
  /** temporary accounts (income/expense/summary) are emptied by closing entries */
  temporary: boolean;
  contra?: boolean;
  /** plain-English description of what the account holds */
  description: string;
  /** group label used on the financial statements */
  group?: string;
}

/** Marks a GST control line so the GST return can find it */
export type GstTag = "output" | "input" | "adj-output" | "adj-input" | "settlement";

export interface JournalLine {
  account: string;
  debit?: number;
  credit?: number;
  /** short memo shown in the journal */
  memo?: string;
  /** beginner explanation of why this line exists */
  why?: string;
  /** customer / supplier / employee for subsidiary ledgers */
  party?: string;
  gst?: GstTag;
}

export type JournalBook =
  | "general"
  | "sales"
  | "purchases"
  | "cash-receipts"
  | "cash-payments"
  | "payroll";

export type TxnKind = "featured" | "routine" | "adjustment" | "closing";

export interface DocItem {
  desc: string;
  qty?: number;
  unit?: number;
  amount: number;
}
export interface DocRow {
  label: string;
  value: string;
  strong?: boolean;
}

export type DocKind =
  | "tax-invoice-in"
  | "tax-invoice-out"
  | "receipt"
  | "z-report"
  | "eftpos-settlement"
  | "deposit-slip"
  | "bank-transfer"
  | "bank-statement"
  | "payslip"
  | "agreement"
  | "internal"
  | "ird"
  | "stocktake";

export interface SourceDoc {
  kind: DocKind;
  title: string;
  issuer: string;
  issuerDetail?: string[];
  recipient?: string;
  recipientDetail?: string[];
  ref?: string;
  date: string;
  items?: DocItem[];
  rows?: DocRow[];
  totals?: DocRow[];
  footer?: string[];
  stamp?: string;
}

export interface Transaction {
  id: string;
  date: string;
  /** date the bank processed it, if different (bank reconciliation timing difference) */
  bankDate?: string;
  /** an item that only shows up when you read the bank statement */
  foundInBankRec?: boolean;
  title: string;
  kind: TxnKind;
  book: JournalBook;
  /** what happened, in plain English. Supports [[term]] / [[term|label]] glossary links */
  story: string;
  doc?: SourceDoc;
  lines: JournalLine[];
  /** extra teaching notes */
  notes?: string[];
  gstNote?: string;
  deepDives?: { href: string; label: string }[];
  /** quick check question */
  quiz?: { q: string; options: string[]; answer: number; explain: string };
  /** for routine summaries: the month it summarises */
  month?: string;
}
