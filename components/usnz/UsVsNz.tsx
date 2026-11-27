"use client";

import Link from "next/link";
import { money, pct } from "@/lib/money";
import { KIWISAVER, MINIMUM_WAGE, TRADING_STOCK } from "@/lib/nz/rates";

const KS = pct(KIWISAVER.employerMinimum);
/** the $1,000 example: PAYE is illustrative, KiwiSaver follows the current rates so the entry always balances */
const EG = { paye: 152, ksEe: 1000 * KIWISAVER.employeeDefault, ksEr: 1000 * KIWISAVER.employerMinimum };
import { cx } from "@/lib/ui";
import { Callout, Quiz } from "@/components/learn/bits";

/* US GAAP vs NZ: the single reference page */

type JL = [string, number | null, number | null];

function MiniJournal({ flag, title, lines, note }: { flag: string; title: string; lines: JL[]; note?: string }) {
  const dr = lines.reduce((s, l) => s + (l[1] ?? 0), 0);
  const cr = lines.reduce((s, l) => s + (l[2] ?? 0), 0);
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="border-b bg-stone-50 px-3 py-2 text-sm font-semibold">{flag} {title}</div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wider text-stone-500"><th className="px-3 py-1">Account</th><th className="px-3 text-right">Dr</th><th className="px-3 text-right">Cr</th></tr></thead>
        <tbody>
          {lines.map(([a, d, c], i) => (
            <tr key={i} className="border-t border-stone-100">
              <td className={cx("px-3 py-1", c !== null && "pl-8")}>{a}</td>
              <td className="num px-3 text-right">{d !== null ? money(d) : ""}</td>
              <td className="num px-3 text-right">{c !== null ? money(c) : ""}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-stone-300 text-xs text-stone-500"><td className="px-3 py-1">Totals (always equal)</td><td className="num px-3 text-right">{money(dr)}</td><td className="num px-3 text-right">{money(cr)}</td></tr>
        </tbody>
      </table>
      {note && <div className="border-t bg-stone-50 px-3 py-2 text-xs text-stone-600">{note}</div>}
    </div>
  );
}

function Compare({ n, title, story, us, nz, nzExtra, takeaway }: { n: number; title: string; story: string; us: React.ReactNode; nz: React.ReactNode; nzExtra?: React.ReactNode; takeaway: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-paper p-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-kowhai-700">Worked example {n}</div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-1 text-stone-700">{story}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">{us}{nz}</div>
      {nzExtra && <div className="mt-4">{nzExtra}</div>}
      <div className="mt-4 rounded-lg bg-kowhai-50 px-4 py-3 text-sm"><strong>The takeaway: </strong>{takeaway}</div>
    </section>
  );
}

const TERMS: [string, string, string][] = [
  ["Withdrawals", "Drawings", "The owner taking money or goods out for personal use. It reduces equity, but it isn't an expense (it wasn't spent earning income) and it isn't a sixth element."],
  ["Revenue (listed as an element)", "Income, made up of revenue + gains", "Revenue is income from normal trading (selling coffee). Gains are one-offs, like selling an old machine for more than its book value. Both count as income."],
  ["Income statement", "Statement of financial performance, or profit & loss (P&L)", "NZ IFRS's formal name is “statement of profit or loss and other comprehensive income”. In small NZ businesses everyone just says P&L."],
  ["Balance sheet", "Statement of financial position", "Same statement, different name. People in NZ still say “balance sheet” day to day."],
  ["Statement of retained earnings / stockholders' equity", "Statement of changes in equity", "Shows how equity moved: profit added, dividends taken out, new shares issued."],
  ["Owner's equity (sole proprietor)", "Owner's equity / capital (sole trader)", "The same idea and the same word."],
  ["Stockholders, common stock", "Shareholders, share capital (ordinary shares)", "NZ shares have no par (nominal) value, so there's no “additional paid-in capital” account. All the money paid for shares goes into share capital."],
  ["Accounts receivable / payable", "Accounts receivable / payable, or debtors / creditors", "Both pairs of words are used in NZ. Debtors owe you; you owe creditors."],
  ["Merchandise inventory", "Inventory or stock (“trading stock” in tax law)", "Kōwhai's beans, milk, food and cups waiting to be sold."],
  ["Cost of goods sold (COGS)", "Cost of goods sold, or cost of sales", "Same calculation: opening stock + purchases − closing stock."],
  ["Checking account, checks", "Cheque account (or “transaction account”)", "NZ banks stopped issuing cheques around 2021. Payments are EFTPOS, direct debit and online banking."],
  ["Notes payable", "Loan / term loan / bank loan", "NZ textbooks rarely say “notes”."],
  ["Sole proprietorship / partnership / LLC / S corp", "Sole trader / partnership / company / look-through company (LTC)", "An LTC is NZ's closest match to a US pass-through: the company's profit is taxed in the owners' hands."],
  ["Fiscal year (often 1 Jan – 31 Dec)", "Income year: 1 April – 31 March. The last day is the “balance date”.", "Businesses can ask IRD for a different balance date, but 31 March is the norm."],
  ["IRS", "IRD (Inland Revenue, Te Tari Taake)", "Collects income tax, GST, PAYE and KiwiSaver, and administers student loans."],
  ["FASB / US GAAP", "XRB (External Reporting Board) / NZ IFRS and PBE standards", "NZ IFRS is international (IFRS) standards with a few NZ additions. PBE standards are for councils, government and charities."],
];

const QUIZ: { q: string; options: string[]; answer: number; explain: string }[] = [
  { q: "An American textbook tells you to debit “Withdrawals” when Aroha takes $500. Kōwhai is a company. What does Kōwhai debit?", options: ["Withdrawals", "Drawings expense", "Aroha's shareholder current account"], answer: 2, explain: "In a company, money taken by a shareholder is recorded against their current account (what the company owes them, or they owe it). For a sole trader it would be Drawings." },
  { q: "Kōwhai buys $100 of beans plus $15 GST. A US café buys $100 of beans plus $8 sales tax. Who records the tax as a separate asset they can claim back?", options: ["Both", "Only Kōwhai", "Only the US café"], answer: 1, explain: "GST paid on purchases is claimed back from IRD, so Kōwhai debits the GST account. US sales tax on business purchases is just part of the cost." },
  { q: "Mia's gross pay is $2,080. Which of these does the café NOT have in NZ?", options: ["Employer KiwiSaver contribution", "Employer social-security (FICA-style) tax", "PAYE deducted from Mia's pay"], answer: 1, explain: `NZ has no employer social-security tax. The employer's extra cost is the compulsory ${KS} KiwiSaver contribution (and the annual ACC work levy).` },
  { q: "Which of these is the same in the US and NZ?", options: ["How debits and credits work", "The name of the statement showing assets and liabilities", "The tax year"], answer: 0, explain: "Double entry is universal. The balance sheet is formally the “statement of financial position” in NZ, and the NZ tax year runs 1 April – 31 March." },
];

function WorkedExamples() {
  return (
    <div className="space-y-6">
      <p className="text-stone-600">US amounts use an illustrative 8% sales tax; real US rates vary by state and city. Payroll figures are simplified to show the structure, not exact tax tables.</p>
        <Compare
          n={1}
          title="Buying beans and selling coffee: sales tax vs GST"
          story="Each café buys $100 of beans on credit from a roaster, then sells $500 of coffee for cash to customers."
          us={<MiniJournal flag="🇺🇸" title="Seattle café: buy beans" lines={[["Purchases / Inventory", 100, null], ["Accounts payable", null, 100]]} note="As a business buying stock to resell, it gives the roaster a resale certificate, so no sales tax is charged. (If the café paid sales tax on supplies, the tax would just become part of the cost.)" />}
          nz={<MiniJournal flag="🇳🇿" title="Kōwhai: buy beans" lines={[["Purchases – coffee", 100, null], ["GST (input tax claimable)", 15, null], ["Accounts payable – Southern Roasters", null, 115]]} note="The roaster charges 15% GST. Kōwhai records it separately because it gets it back from IRD." />}
          nzExtra={
            <div className="grid gap-4 lg:grid-cols-2">
              <MiniJournal flag="🇺🇸" title="Seattle café: sell coffee" lines={[["Cash", 540, null], ["Sales revenue", null, 500], ["Sales tax payable", null, 40]]} note="Sales tax collected from customers is owed to the state." />
              <MiniJournal flag="🇳🇿" title="Kōwhai: sell coffee" lines={[["Bank / EFTPOS clearing", 575, null], ["Café sales", null, 500], ["GST (output tax)", null, 75]]} note="Kōwhai owes $75 GST but has already paid $15, so the GST return shows $60 to pay: 15% of the $400 value Kōwhai added." />
            </div>
          }
          takeaway={<>The sales side looks almost identical. The difference is on purchases: NZ businesses <strong>claim back</strong> GST, so they keep it out of their costs. In NZ, prices on shelves include GST (a coffee is $5.75, not $5.00 + tax). That&apos;s why Kōwhai works the GST out of its takings with <strong>× 3/23</strong>.</>}
        />

        <Compare
          n={2}
          title="The owner takes money out"
          story="The owner takes $500 from the business bank account for personal use."
          us={<MiniJournal flag="🇺🇸" title="US sole proprietor" lines={[["Owner, Withdrawals", 500, null], ["Cash", null, 500]]} note="Withdrawals is closed to Owner, Capital at year end." />}
          nz={<MiniJournal flag="🇳🇿" title="NZ sole trader" lines={[["Drawings", 500, null], ["Bank", null, 500]]} note="Identical entry, NZ word. Drawings is closed to Owner's capital at year end." />}
          nzExtra={<MiniJournal flag="🇳🇿" title="NZ company (Kōwhai): Aroha takes $500" lines={[["Shareholder current account – Aroha", 500, null], ["Bank", null, 500]]} note="A company is a separate legal person, so the money is a loan to Aroha (reducing what the company owes her) until it's covered by a shareholder salary or dividend. A US corporation would usually pay salary through payroll or declare a dividend instead." />}
          takeaway={<>For a sole trader the only change is the word: <strong>withdrawals = drawings</strong>. For a company it changes more, because owners are paid through <strong>current accounts, shareholder salaries and dividends</strong>.</>}
        />

        <Compare
          n={3}
          title="Paying an employee $1,000 gross"
          story="Each café pays a barista $1,000 gross for a fortnight. Figures are simplified to show the structure, not exact tax tables."
          us={<MiniJournal flag="🇺🇸" title="Seattle café: payroll" lines={[["Wages expense", 1000, null], ["Payroll tax expense (employer FICA 7.65% + unemployment)", 90, null], ["Federal income tax withheld", null, 80], ["FICA payable (employee 7.65% + employer 7.65%)", null, 153], ["Unemployment taxes payable", null, 13.5], ["Cash (net pay)", null, 843.5]]} note="The employer pays its own 7.65% FICA on top of wages. Washington State has no state income tax; most states do." />}
          nz={<MiniJournal flag="🇳🇿" title="Kōwhai: payroll" lines={[["Wages", 1000, null], [`KiwiSaver employer contributions (${KS})`, EG.ksEr, null], [`PAYE & deductions payable (PAYE incl ACC levy, employee KiwiSaver ${pct(KIWISAVER.employeeDefault)}, employer KiwiSaver incl ESCT)`, null, EG.paye + EG.ksEe + EG.ksEr], ["Bank (net pay)", null, 1000 - EG.paye - EG.ksEe]]} note={`Illustrative: PAYE about ${money(EG.paye, { dp: 0 })} (incl ACC levy), employee KiwiSaver ${money(EG.ksEe, { dp: 0 })}, employer KiwiSaver ${money(EG.ksEr, { dp: 0 })}. No employer social-security tax. Everything deducted is paid to IRD by the 20th of next month.`} />}
          takeaway={<>The structure is the same: <strong>expense at gross, deductions become liabilities, net goes out of the bank</strong>. The taxes are different. NZ has <strong>PAYE</strong> (which includes the ACC levy) and <strong>KiwiSaver</strong>; the US has <strong>FICA</strong>, income-tax withholding and unemployment taxes.</>}
        />

        <Compare
          n={4}
          title="Year end: closing the books"
          story="At balance date, income and expense accounts are reset to zero and the profit moves into equity."
          us={<MiniJournal flag="🇺🇸" title="US: close revenue" lines={[["Sales revenue", 442700, null], ["Income summary", null, 442700]]} note="Then expenses → Income Summary → Retained Earnings (corporation) or Capital (sole proprietor)." />}
          nz={<MiniJournal flag="🇳🇿" title="Kōwhai: close income" lines={[["Café sales and other income", 442700, null], ["Income summary", null, 442700]]} note="Exactly the same process: income summary → retained earnings. See cycle step 10." />}
          takeaway={<>The cycle is <strong>identical</strong>. Only the date differs: Kōwhai closes on <strong>31 March</strong>, not 31 December.</>}
        />
    </div>
  );
}

/* ───────────── Reference sections ───────────── */

type Impact = "high" | "medium" | "low";
const IMPACT: Record<Impact, { label: string; cls: string; meaning: string }> = {
  high: { label: "High impact", cls: "bg-rose-100 text-rose-800", meaning: "affects the café's everyday books" },
  medium: { label: "Medium", cls: "bg-amber-100 text-amber-800", meaning: "comes up at year end or occasionally" },
  low: { label: "Low", cls: "bg-stone-200 text-stone-700", meaning: "mostly a textbook curiosity for a small business" },
};

interface Row { topic: string; us: string; nz: string; cafe?: string }
interface Section { id: string; title: string; impact: Impact; summary: string; rows?: Row[]; custom?: "terms" | "examples" }

const SECTIONS: Section[] = [
  {
    id: "framework", title: "Who sets the rules", impact: "low",
    summary: "Different rulebooks, same purpose. For a small NZ company, IRD's minimum requirements matter far more than either full standard.",
    rows: [
      { topic: "Accounting standards", us: "US GAAP, written by the FASB (Financial Accounting Standards Board). Very detailed and rules-based.", nz: "NZ IFRS (international standards, with a few NZ additions) for businesses, and PBE standards for councils, government and charities. Issued by the XRB (External Reporting Board). More principles-based: it relies on judgement." },
      { topic: "Tax rules", us: "Federal Internal Revenue Code (IRS), plus separate state and local tax laws.", nz: "One national system: Income Tax Act 2007, GST Act 1985 and Tax Administration Act 1994, run by IRD. No state or local income or sales taxes (councils charge rates on property instead).", cafe: "Kōwhai only ever deals with IRD for tax." },
      { topic: "Which standards a small business must follow", us: "Private companies have no legal duty to follow GAAP, but banks and investors often ask for GAAP statements. Public companies report to the SEC.", nz: "Small companies prepare special-purpose financial statements meeting IRD's minimum requirements (Tax Administration (Financial Statements) Order 2014). Full NZ IFRS (and usually an audit) applies only to large or publicly accountable entities.", cafe: "Kōwhai's statements are special-purpose, prepared for IRD, the bank and its shareholders." },
    ],
  },
  { id: "terms", title: "Terminology: the words that change", impact: "high", summary: "Most of the confusion between US and NZ material is just vocabulary: the same thing, called something else.", custom: "terms" },
  {
    id: "statements", title: "Financial statements", impact: "medium",
    summary: "The same statements under different names, with a few layout and classification choices that differ.",
    rows: [
      { topic: "Names", us: "Income statement · Balance sheet · Statement of retained earnings / stockholders' equity · Statement of cash flows.", nz: "Statement of financial performance (P&L) · Statement of financial position (balance sheet) · Statement of changes in equity · Statement of cash flows.", cafe: "This app uses the NZ names, with “P&L” and “balance sheet” as everyday shorthand." },
      { topic: "Balance sheet layout", us: "Assets listed in order of liquidity (cash first), then liabilities, then equity. Usually a single column.", nz: "NZ IFRS requires current and non-current items to be shown separately but doesn't fix the order. Small NZ businesses usually put current items first; some use a “net assets” layout (assets − liabilities = equity).", cafe: "Kōwhai's balance sheet shows current items first, and splits the bank loan into current and non-current parts." },
      { topic: "Grouping expenses", us: "Public companies usually group by function (cost of sales, selling, administrative).", nz: "By nature (wages, rent, depreciation) or by function, whichever is more useful.", cafe: "Kōwhai groups by nature: you can see wages, rent and power separately." },
      { topic: "Interest and dividends in the cash flow statement", us: "Interest paid and received: operating. Dividends paid: financing.", nz: "Under current NZ IFRS (IAS 7) you choose operating, investing or financing and stay consistent. NZ IFRS 18, for periods starting on or after 1 January 2027, removes most of that choice for entities reporting under full NZ IFRS.", cafe: "Kōwhai shows interest paid under operating. As a special-purpose reporter it isn't affected by IFRS 18." },
      { topic: "Extraordinary items", us: "Abolished in 2015.", nz: "Not allowed.", cafe: "Older US textbooks may still mention them. Ignore them." },
    ],
  },
  {
    id: "equity", title: "Owners, equity and closing", impact: "high",
    summary: "The mechanics are identical; the words and the way company owners get paid are different.",
    rows: [
      { topic: "Owner taking money out", us: "Withdrawals (sole proprietor). A corporation pays salary through payroll or declares dividends.", nz: "Drawings (sole trader). In a small company, shareholders' drawings go to their shareholder current account, and are covered later by a shareholder salary or dividend.", cafe: "Aroha's and Ben's drawings sit in accounts 240 and 241 until their year-end salaries are credited." },
      { topic: "Share capital", us: "Common stock at par value, plus additional paid-in capital for any amount above par.", nz: "No par value: everything paid for shares is share capital.", cafe: "Kōwhai's $100,000 is all in account 300 Share capital." },
      { topic: "Paying a dividend", us: "Governed by each state's corporate law; tests vary by state.", nz: "The board must be satisfied the company will pass the solvency test immediately afterwards, and directors sign a certificate (Companies Act 1993 ss 4, 52)." },
      { topic: "Closing entries", us: "Revenue and expenses → Income Summary → Retained Earnings (or Capital); Withdrawals → Capital.", nz: "Exactly the same.", cafe: "See cycle step 10. The only difference is the date: 31 March." },
    ],
  },
  {
    id: "revenue", title: "Revenue, debtors and bad debts", impact: "medium",
    summary: "The accounting is now almost the same in both countries. The tax and GST treatment of bad debts is where NZ differs.",
    rows: [
      { topic: "When revenue is recognised", us: "ASC 606: a five-step model based on contracts with customers.", nz: "NZ IFRS 15: the same five-step model. The US and international standards were written together.", cafe: "Kōwhai recognises catering revenue when the event is done, and treats the wedding deposit as income in advance." },
      { topic: "Bad and doubtful debts in the accounts", us: "GAAP requires an allowance for expected losses (the CECL model). The “direct write-off method” is taught but isn't GAAP when amounts are material.", nz: "NZ IFRS 9 also uses expected credit losses. Small special-purpose reporters commonly just write off specific bad debts.", cafe: "Kōwhai writes off Pop-Up Events' unpaid invoice directly." },
      { topic: "Bad debts for tax", us: "Deductible when specifically written off; a reserve isn't deductible.", nz: "The same: only debts actually written off are deductible, not a doubtful-debts provision." },
      { topic: "Sales tax / GST on a bad debt", us: "Some states allow a sales-tax refund on bad debts; rules vary by state.", nz: "On the invoice basis, the GST already paid on a written-off debt is claimed back in the GST return (a credit adjustment).", cafe: "Kōwhai's bad debt write-off includes a GST adjustment. See NZ → GST." },
    ],
  },
  { id: "examples", title: "Worked examples: the same transaction, both ways", impact: "high", summary: "Kōwhai and an imaginary twin café in Seattle record the same events.", custom: "examples" },
  {
    id: "gst", title: "Sales tax vs GST", impact: "high",
    summary: "The biggest practical difference. GST touches almost every transaction Kōwhai records.",
    rows: [
      { topic: "Who sets it, and the rate", us: "Each state and city: from 0% to over 10% combined, with different rules on what's taxable (food is often exempt).", nz: "One national 15% rate on almost everything, including food.", cafe: "Every coffee, muffin and catering job carries 15% GST." },
      { topic: "Which sales it's charged on", us: "Mostly only retail sales to the final customer. Businesses buying stock to resell give the supplier a resale certificate and pay no tax.", nz: "Charged on every sale by a registered business, including business-to-business sales." },
      { topic: "Tax on purchases", us: "A business generally can't claim back sales tax it pays on its own costs. It's part of the cost.", nz: "Registered businesses claim back GST on business purchases (input tax). GST is never a cost or income for them.", cafe: "Kōwhai claimed back $2,400 of GST on its espresso machine." },
      { topic: "Prices", us: "Shelf prices exclude tax; tax is added at the till.", nz: "Prices shown to consumers must include GST.", cafe: "That's why Kōwhai works GST out of its takings with × 3/23." },
      { topic: "Registration and returns", us: "Register with each state where you have “nexus”. File returns to each state.", nz: "Register with IRD once turnover passes $60,000. File one GST return monthly, two-monthly or six-monthly.", cafe: "Kōwhai files two-monthly. See NZ → GST return." },
    ],
  },
  {
    id: "payroll", title: "Payroll and employment", impact: "high",
    summary: "Completely different taxes and entitlements. The journal entry has the same shape: expense at gross, deductions become liabilities, net to the bank.",
    rows: [
      { topic: "Taxes deducted from pay", us: "Federal income tax withholding, state (and sometimes city) income tax, and employee FICA: 6.2% Social Security + 1.45% Medicare.", nz: "PAYE, which includes income tax and the 1.75% ACC earners' levy. Plus student loan (12% over the threshold) and KiwiSaver if they apply.", cafe: "Mia's payslip: PAYE $304.79 + ACC levy $36.40, student loan $138.24, KiwiSaver $72.80." },
      { topic: "Employer's own taxes and costs", us: "Employer matches FICA (7.65%), plus federal and state unemployment taxes, and buys workers' compensation insurance.", nz: `No employer social-security or unemployment tax. Compulsory ${KS} KiwiSaver for members (less ESCT), and the annual ACC work levy.`, cafe: "Kōwhai's extra cost on Mia's $2,080 is $72.80 KiwiSaver." },
      { topic: "Forms and reporting", us: "W-4 from the employee; quarterly Form 941; year-end W-2 to each employee.", nz: "IR330 tax code declaration from the employee; payday filing to IRD within 2 working days of every payday; PAYE paid by the 20th of the next month." },
      { topic: "Personal tax returns", us: "Almost every worker files an annual return (Form 1040).", nz: "Most employees don't need to. PAYE is designed to be exactly right, and IRD auto-calculates refunds.", cafe: "Mia and Leo don't file returns. Aroha and Ben do (IR3), because of their shareholder salaries." },
      { topic: "Paid leave", us: "No federal requirement for paid vacation or public holidays. It depends on the employer and the state.", nz: "Holidays Act 2003: 4 weeks' annual leave, 12 public holidays (time and a half plus a day in lieu if worked), 10 days' sick leave and bereavement leave.", cafe: "Kōwhai accrues holiday pay for Mia and pays Leo 8% on top of each pay." },
      { topic: "Minimum wage and overtime", us: "Federal minimum $7.25 an hour, with higher state and city rates. Time and a half for hours over 40 a week (FLSA).", nz: `${money(MINIMUM_WAGE.adult)} an hour nationally (from ${MINIMUM_WAGE.from}). No legal overtime premium: it's whatever the employment agreement says. Time and a half is required only on public holidays.` },
      { topic: "Workplace injury", us: "Employer-bought workers' compensation insurance, regulated by each state. Employees can sometimes sue.", nz: "ACC: a no-fault government scheme for everyone, funded by levies. You generally can't sue for personal injury." },
      { topic: "Retirement savings", us: "401(k) plans are optional for employers; any employer match is voluntary.", nz: "KiwiSaver: new employees are automatically enrolled (they can opt out), and employer contributions are compulsory for members." },
      { topic: "Pay frequency", us: "Biweekly or semi-monthly are common.", nz: "Weekly or fortnightly are common. A “fortnight” is NZ's biweekly.", cafe: "Kōwhai pays fortnightly." },
    ],
  },
  {
    id: "income-tax", title: "Income tax", impact: "high",
    summary: "Different rates, a different year and different ways of paying during the year. Many deduction ideas are similar.",
    rows: [
      { topic: "Tax year", us: "The calendar year for individuals. Many businesses use 1 January – 31 December.", nz: "1 April – 31 March, named after the year it ends (the “2027 income year”).", cafe: "Kōwhai's balance date is 31 March 2027." },
      { topic: "Company tax", us: "21% federal, plus state corporate tax in most states.", nz: "28% flat. There's no state tax.", cafe: "Kōwhai's tax is $16,845.64 on $60,163 taxable income." },
      { topic: "Individual tax", us: "Federal brackets from 10% to 37%, plus state income tax in most states.", nz: "10.5% to 39% (five brackets). No state tax." },
      { topic: "Paying tax during the year", us: "Estimated tax: four instalments (April, June, September, January for individuals).", nz: "Provisional tax: usually three instalments (28 August, 15 January, 7 May for a 31 March year), required once last year's residual income tax was over $5,000.", cafe: "Kōwhai starts provisional tax in its second year." },
      { topic: "Returns", us: "Form 1120 (C corp), 1120-S (S corp), 1065 (partnership), 1040 (individuals).", nz: "IR4 (company), IR7 (partnership or LTC), IR3 (individuals)." },
      { topic: "Meals and entertainment", us: "Business meals are generally 50% deductible; entertainment is generally not deductible.", nz: "Entertainment (including business meals) is generally 50% deductible, and half the GST claimed on it is paid back.", cafe: "Kōwhai adds back half of its client lunch and staff party costs." },
      { topic: "Capital gains", us: "Taxed, at lower rates for assets held over a year.", nz: "No general capital gains tax. Gains are taxed only in specific cases (e.g. property sold under the bright-line test, or assets bought to resell). Depreciation recovered on sale is taxed." },
    ],
  },
  {
    id: "dividends", title: "Dividends and the company–shareholder link", impact: "medium",
    summary: "NZ's imputation system stops company profit being fully taxed twice.",
    rows: [
      { topic: "How dividends are taxed", us: "“Double taxation”: profit is taxed in the corporation, and dividends are taxed again in the shareholder's hands (at qualified-dividend rates).", nz: "Imputation: the company attaches credits for the 28% tax it already paid. The shareholder is taxed at their own rate on the grossed-up dividend and gets a credit for the company's tax.", cafe: "See NZ → Shareholders for the calculator." },
      { topic: "Tax deducted on dividends", us: "Usually none for US residents (backup withholding aside).", nz: "The company deducts resident withholding tax (33% less imputation credits, so 5% on a fully imputed dividend)." },
      { topic: "Pass-through companies", us: "S corporations and many LLCs pass profit to owners for tax.", nz: "Look-through companies (LTCs) do the same." },
    ],
  },
  {
    id: "assets", title: "Fixed assets, depreciation and leases", impact: "medium",
    summary: "The concepts are the same. NZ small businesses usually keep one depreciation schedule; the US usually needs two.",
    rows: [
      { topic: "Tax vs book depreciation", us: "Different systems: MACRS, bonus depreciation and Section 179 for tax, usually straight line in the books. Even small businesses track two schedules.", nz: "Small businesses usually use IRD's rates (DV or SL) in their accounts too, so there's one schedule. Investment Boost (20% up front) is the main tax-only extra.", cafe: "Kōwhai's only tax adjustment for assets is Investment Boost. See the tax reconciliation." },
      { topic: "Expensing small purchases", us: "De minimis safe harbor: items up to $2,500 per invoice (if elected).", nz: "Low-value assets: $1,000 or less (excl GST) can be expensed immediately.", cafe: "Kōwhai expensed its blender and small appliances." },
      { topic: "Revaluing assets", us: "Not allowed: historical cost only.", nz: "Allowed for a whole class of property, plant and equipment (mostly used for land and buildings)." },
      { topic: "Reversing an impairment", us: "Not allowed once written down.", nz: "Allowed (except for goodwill) if value recovers." },
      { topic: "Buildings for tax", us: "Depreciable over 39 years (commercial).", nz: "0% depreciation rate for buildings (from the 2024–25 year). Fit-out is depreciated separately.", cafe: "Kōwhai depreciates its fit-out at 20% DV." },
      { topic: "Leases", us: "ASC 842: lessees put leases on the balance sheet, but operating leases still show one straight-line lease expense.", nz: "NZ IFRS 16: lessees put leases on the balance sheet and show depreciation plus interest. Small special-purpose reporters usually just expense rent.", cafe: "Kōwhai expenses its rent as it's used. Prepaid rent is an asset until then." },
      { topic: "Development costs", us: "Generally expensed.", nz: "Capitalised once strict criteria are met (IAS 38)." },
    ],
  },
  {
    id: "inventory", title: "Inventory", impact: "medium",
    summary: "Mostly the same, except LIFO and write-down reversals.",
    rows: [
      { topic: "Cost methods", us: "FIFO, weighted average or LIFO.", nz: "FIFO or weighted average. LIFO is not allowed.", cafe: "Kōwhai values its stocktake at FIFO cost." },
      { topic: "Write-downs", us: "Lower of cost and net realisable value; a write-down can't be reversed.", nz: "Lower of cost and net realisable value; a write-down can be reversed if the value recovers." },
      { topic: "Small-business simplifications for tax", us: "Small businesses (under a gross-receipts limit) can use simplified inventory methods.", nz: `Sales under ${money(TRADING_STOCK.lowValue.salesUnder, { dp: 0 })} and closing stock reasonably estimated under ${money(TRADING_STOCK.lowValue.stockEstimateUnder, { dp: 0 })}: closing stock may be valued at its opening value, with no year-end count (IRD's low value trading stock rule).`, cafe: "Kōwhai qualifies but counts its stock anyway." },
    ],
  },
  {
    id: "banking", title: "Banking and the bank reconciliation", impact: "low",
    summary: "The bank reconciliation works the same way, but the payment methods (and their names) differ.",
    rows: [
      { topic: "Payment methods", us: "Checks are still common; ACH transfers; debit and credit cards.", nz: "No cheques (banks stopped issuing them around 2021). Payments are EFTPOS, direct credit, direct debit, online banking and cards." },
      { topic: "Reconciliation items", us: "Outstanding checks, deposits in transit, NSF (bounced) checks.", nz: "Unpresented payments (e.g. a late-night online payment), deposits in transit, dishonoured payments.", cafe: "Kōwhai's March reconciliation has one unpresented payment, one deposit in transit and a bank fee to record." },
      { topic: "Account names", us: "Checking account, savings account.", nz: "Cheque or transaction account, savings account, term deposit.", cafe: "Kōwhai has a cheque account and a term deposit." },
    ],
  },
  {
    id: "structures", title: "Business structures", impact: "medium",
    summary: "Similar options with different names and tax treatment.",
    rows: [
      { topic: "One owner", us: "Sole proprietorship (Schedule C on the owner's 1040).", nz: "Sole trader (IR3)." },
      { topic: "Several owners, no company", us: "General or limited partnership.", nz: "Partnership or limited partnership (IR7; each partner files an IR3)." },
      { topic: "Company", us: "C corporation (taxed separately), S corporation (pass-through) or LLC (flexible).", nz: "Company (taxed at 28%) or look-through company (pass-through). There's no LLC.", cafe: "Kōwhai is an ordinary company." },
      { topic: "Registration", us: "With the state (Secretary of State).", nz: "With the Companies Office, plus an annual return every year." },
    ],
  },
  {
    id: "language", title: "Language, dates and formatting", impact: "low",
    summary: "Small things that cause real mistakes.",
    rows: [
      { topic: "Dates", us: "Month/day/year: 04/05/2026 is April 5.", nz: "Day/month/year: 04/05/2026 is 4 May.", cafe: "This matters when you read source documents and bank statements." },
      { topic: "Spelling", us: "Check, organization, program, labor.", nz: "Cheque, organisation, programme, labour." },
      { topic: "Everyday words", us: "Revenue, sales; payroll; vendor.", nz: "Also “turnover” for total sales (especially for GST thresholds); “wages”; supplier." },
    ],
  },
];

function ImpactChip({ impact }: { impact: Impact }) {
  return <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-bold", IMPACT[impact].cls)}>{IMPACT[impact].label}</span>;
}

function RowsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.topic} className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="font-bold">{r.topic}</div>
          <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg bg-stone-50 p-3"><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">🇺🇸 United States</div>{r.us}</div>
            <div className="rounded-lg bg-kowhai-50 p-3"><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-kowhai-700">🇳🇿 New Zealand</div>{r.nz}</div>
          </div>
          {r.cafe && <div className="mt-2 text-xs text-stone-600">☕ {r.cafe}</div>}
        </div>
      ))}
    </div>
  );
}

function TermsTable() {
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500"><th className="px-3 py-2">🇺🇸 US source says</th><th className="px-3">🇳🇿 NZ says</th><th className="px-3">What it means</th></tr></thead>
          <tbody>
            {TERMS.map(([us, nz, note]) => (
              <tr key={us} className="border-b border-stone-100 align-top">
                <td className="px-3 py-2 text-stone-600">{us}</td>
                <td className="px-3 py-2 font-semibold">{nz}</td>
                <td className="px-3 py-2 text-stone-700">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout kind="nz" title="The elements">US GAAP&apos;s concepts list ten elements, including “investments by owners”, “distributions to owners”, revenues, gains and losses as separate items. NZ IFRS has just five: assets, liabilities, equity, income and expenses. Owner investments and drawings are movements in equity; gains sit inside income and losses inside expenses. Same transactions, grouped differently.</Callout>
      <p className="text-sm text-stone-600">Every US term here is also in the <Link href="/glossary" className="underline">glossary</Link> under “🇺🇸 US → NZ terms”.</p>
    </>
  );
}

export function UsVsNz() {
  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="prose-learn text-[16px]">
          <p>Much free accounting material online is American. It follows <strong>US GAAP</strong> and US tax law. New Zealand uses <strong>NZ IFRS</strong> for financial reporting and its own tax system, run by <strong>IRD</strong>.</p>
          <p>The good news: <strong>the mechanics are identical</strong>. A debit is a debit in Wellington and in Washington. What changes is:</p>
          <ol>
            <li><strong>Words</strong>: different names for the same thing (withdrawals → drawings).</li>
            <li><strong>Tax</strong>: completely different taxes (sales tax → GST, FICA → PAYE and KiwiSaver).</li>
            <li><strong>Some reporting rules</strong>: mostly things a small café rarely meets.</li>
          </ol>
          <p>This page is the single reference for all the differences. Each section has an impact rating, so you know what matters for a small NZ business and what you can safely skim.</p>
        </div>
        <div className="grid gap-3 self-start">
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <div className="font-bold text-emerald-800">✓ Carries over unchanged</div>
            <ul className="mt-1 list-disc pl-5 text-sm">
              <li>Double entry, debits &amp; credits, normal balances</li>
              <li>The accounting equation (A = L + E)</li>
              <li>T-accounts, journals, ledgers, trial balance</li>
              <li>Accrual accounting, adjusting and closing entries</li>
              <li>Revenue recognition (the same five-step model)</li>
              <li>Bank reconciliations, most ratios and analysis</li>
            </ul>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
            <div className="mb-2 font-bold">Impact ratings</div>
            {(Object.keys(IMPACT) as Impact[]).map((k) => <div key={k} className="mb-1 flex items-center gap-2"><ImpactChip impact={k} /> {IMPACT[k].meaning}</div>)}
          </div>
        </div>
      </div>

      <nav id="contents" className="scroll-mt-20 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">On this page</div>
        <ol className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <span className="num w-5 text-stone-400">{i + 1}.</span>
              <a href={`#${s.id}`} className="flex-1 font-medium hover:underline">{s.title}</a>
              <ImpactChip impact={s.impact} />
            </li>
          ))}
          <li className="flex items-center gap-2 text-sm"><span className="num w-5 text-stone-400">{SECTIONS.length + 1}.</span><a href="#quiz" className="font-medium hover:underline">Check yourself</a></li>
        </ol>
      </nav>

      {SECTIONS.map((s, i) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{i + 1}. {s.title}</h2>
              <ImpactChip impact={s.impact} />
            </div>
            <p className="mt-1 max-w-4xl text-stone-600">{s.summary}</p>
          </div>
          {s.custom === "terms" && <TermsTable />}
          {s.custom === "examples" && <WorkedExamples />}
          {s.rows && <RowsTable rows={s.rows} />}
          <a href="#contents" className="inline-block text-xs text-stone-400 hover:underline">↑ back to contents</a>
        </section>
      ))}

      <section id="quiz" className="scroll-mt-20">
        <h2 className="mb-3 text-2xl font-bold">{SECTIONS.length + 1}. Check yourself</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {QUIZ.map((x) => <Quiz key={x.q} q={x.q} options={x.options} answer={x.answer} explain={x.explain} />)}
        </div>
      </section>

      <Callout kind="tip" title="How to keep using an American resource">
        Keep using it for the <strong>mechanics</strong>: debits, credits, adjusting entries, closing and ratios work the same everywhere. Whenever it gets to <strong>tax</strong>, <strong>owner&apos;s equity</strong>, <strong>statement names</strong> or <strong>business structures</strong>, check the matching section here.
      </Callout>
    </div>
  );
}
