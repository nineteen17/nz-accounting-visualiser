import { r2 } from "@/lib/money";
import {
  ACC_EARNERS_LEVY,
  ESCT_BANDS,
  IETC,
  INDIVIDUAL_TAX_BRACKETS,
  KIWISAVER,
  PAYS_PER_YEAR,
  STUDENT_LOAN,
} from "./rates";

/** Progressive tax on an annual income, plus a bracket-by-bracket breakdown for teaching */
export function progressiveTax(income: number, brackets = INDIVIDUAL_TAX_BRACKETS) {
  let prev = 0;
  let total = 0;
  const steps: { from: number; to: number; rate: number; taxable: number; tax: number }[] = [];
  for (const b of brackets) {
    if (income <= prev) break;
    const top = Math.min(income, b.upTo);
    const taxable = top - prev;
    const tax = taxable * b.rate;
    steps.push({ from: prev, to: top, rate: b.rate, taxable, tax });
    total += tax;
    prev = b.upTo;
  }
  return { total, steps };
}

export function ietcFor(annual: number) {
  if (annual < IETC.from || annual > IETC.to) return 0;
  if (annual <= IETC.abateFrom) return IETC.annual;
  return Math.max(0, IETC.annual - (annual - IETC.abateFrom) * IETC.abatementRate);
}

export type TaxCode = "M" | "ME" | "SB" | "S" | "SH" | "ST" | "SA" | "CAE";

export const TAX_CODES: Record<TaxCode, { label: string; flat?: number; explain: string }> = {
  M: { label: "M", explain: "Main job, no independent earner tax credit. Most common code." },
  ME: { label: "ME", explain: "Main job, earning $24,000–$70,000 a year and eligible for the $520/yr independent earner tax credit (IETC)." },
  SB: { label: "SB", flat: 0.105, explain: "Secondary job, total annual income under $15,600." },
  S: { label: "S", flat: 0.175, explain: "Secondary job, total annual income $15,601–$53,500." },
  SH: { label: "SH", flat: 0.3, explain: "Secondary job, total annual income $53,501–$78,100." },
  ST: { label: "ST", flat: 0.33, explain: "Secondary job, total annual income $78,101–$180,000." },
  SA: { label: "SA", flat: 0.39, explain: "Secondary job, total annual income over $180,000." },
  CAE: { label: "CAE", flat: 0.105, explain: "Casual agricultural employee (short-term harvest workers etc.)." },
};

/** PAYE for one pay (includes the ACC earners' levy, like IRD's PAYE tables) */
export type AccLevy = { rate: number; maxLiableEarnings: number };

export function payeForPay(gross: number, code: TaxCode, paysPerYear = PAYS_PER_YEAR, acc: AccLevy = ACC_EARNERS_LEVY) {
  const annual = gross * paysPerYear;
  const accAnnual = Math.min(annual, acc.maxLiableEarnings) * acc.rate;
  const flat = TAX_CODES[code].flat;
  const taxAnnual = flat !== undefined ? annual * flat : progressiveTax(annual).total;
  const ietcAnnual = code === "ME" ? ietcFor(annual) : 0;
  const incomeTax = r2((taxAnnual - ietcAnnual) / paysPerYear);
  const accLevy = r2(accAnnual / paysPerYear);
  return {
    annualised: annual,
    taxAnnual,
    ietcAnnual,
    accAnnual,
    incomeTax,
    accLevy,
    paye: r2(incomeTax + accLevy),
  };
}

export function esctRateFor(annualSalaryPlusEmployerContrib: number) {
  return ESCT_BANDS.find((b) => annualSalaryPlusEmployerContrib <= b.upTo)!.rate;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  rate: number;
  code: TaxCode;
  studentLoan: boolean;
  kiwiSaver: number | null; // employee rate, or null if opted out
  casual: boolean; // casual → 8% holiday pay paid with every pay
  irdNumber: string;
}

export interface PayResult {
  employee: Employee;
  hours: number;
  ordinary: number;
  holidayPay: number;
  gross: number;
  incomeTax: number;
  accLevy: number;
  paye: number;
  ietcPerPay: number;
  studentLoan: number;
  ksEmployee: number;
  net: number;
  ksEmployerGross: number;
  esctRate: number;
  esct: number;
  ksEmployerNet: number;
  /** total of all deductions + employer KS (gross) the café must pay IRD */
  toIrd: number;
  employerCost: number;
}

/** One employee's fortnightly pay, calculated the way payroll software does it */
export function calcPay(employee: Employee, hours: number, acc: AccLevy = ACC_EARNERS_LEVY): PayResult {
  const ordinary = r2(hours * employee.rate);
  const holidayPay = employee.casual ? r2(ordinary * 0.08) : 0;
  const gross = r2(ordinary + holidayPay);
  const p = payeForPay(gross, employee.code, PAYS_PER_YEAR, acc);
  const studentLoan = employee.studentLoan
    ? r2(Math.max(0, gross - STUDENT_LOAN.fortnightlyThreshold) * STUDENT_LOAN.rate)
    : 0;
  const ksEmployee = employee.kiwiSaver ? r2(gross * employee.kiwiSaver) : 0;
  const net = r2(gross - p.paye - studentLoan - ksEmployee);
  const ksEmployerGross = employee.kiwiSaver !== null ? r2(gross * KIWISAVER.employerMinimum) : 0;
  const esctRate = esctRateFor(gross * PAYS_PER_YEAR + ksEmployerGross * PAYS_PER_YEAR);
  const esct = r2(ksEmployerGross * esctRate);
  const ksEmployerNet = r2(ksEmployerGross - esct);
  const toIrd = r2(p.paye + studentLoan + ksEmployee + ksEmployerGross);
  return {
    employee,
    hours,
    ordinary,
    holidayPay,
    gross,
    incomeTax: p.incomeTax,
    accLevy: p.accLevy,
    paye: p.paye,
    ietcPerPay: r2(p.ietcAnnual / PAYS_PER_YEAR),
    studentLoan,
    ksEmployee,
    net,
    ksEmployerGross,
    esctRate,
    esct,
    ksEmployerNet,
    toIrd,
    employerCost: r2(gross + ksEmployerGross),
  };
}
