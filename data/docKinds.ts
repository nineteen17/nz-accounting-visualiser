import type { SourceDoc } from "@/lib/engine/types";

/** what each kind of source document is called */
export const DOC_KIND_LABEL: Record<SourceDoc["kind"], string> = {
  "tax-invoice-in": "Supplier tax invoice (a bill)",
  "tax-invoice-out": "Our tax invoice to a customer",
  receipt: "Receipt",
  "z-report": "POS Z-report",
  "eftpos-settlement": "Card settlement statement",
  "deposit-slip": "Bank deposit slip",
  "bank-transfer": "Bank transfer record",
  "bank-statement": "Bank statement",
  payslip: "Payslip",
  agreement: "Agreement / confirmation",
  internal: "Internal document / working",
  ird: "IRD return / payment",
  stocktake: "Stocktake sheet",
};
