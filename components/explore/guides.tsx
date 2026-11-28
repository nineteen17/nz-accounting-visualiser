"use client";

import type { ComponentProps } from "react";
import { ToolGuide } from "@/components/learn/ToolGuide";

/**
 * The "New here?" guides for the Explore tools that don't carry their own (the newer tools put a ToolGuide at their top).
 * Keyed by the tool's slug in app/explore/tools.ts; app/explore/[tool]/page.tsx shows the matching one above the tool.
 */
const GUIDES: Record<string, ComponentProps<typeof ToolGuide>> = {
  journal: {
    what: <>Every transaction Kōwhai recorded in year 1, in date order: the <strong>journal</strong>, the book where each one is first written down as debits and credits. Each entry comes with its story and the reason for every line.</>,
    steps: [
      <>Search for anything: a word like <em>rent</em>, a person like <em>Mia</em>, or a reference.</>,
      <>Narrow it down by <strong>journal</strong> (sales, purchases, payroll…) or by <strong>kind</strong>. ★ Featured entries are the ones explained in the most detail.</>,
      <>Tap an entry to open its story and its journal entry, with the &quot;why&quot; for each line.</>,
    ],
    read: <>Each row shows the date, the reference, what happened, and the entry&apos;s total (its debits, which always equal its credits). In an opened entry, debits are listed first and credits are indented below them.</>,
    terms: [
      { k: "journal", says: "the book where each transaction is first recorded, in date order." },
      { k: "special-journals", says: "separate journals for common kinds of transaction: sales, purchases, cash in, cash out, payroll." },
      { k: "debit", says: "the left side of an entry. It increases assets and expenses." },
      { k: "credit", says: "the right side. It increases liabilities, equity and income." },
      { k: "compound-entry", says: "an entry with more than two lines, like a pay run." },
      { k: "adjusting-entry", label: "Year-end adjustment", says: "an entry made at 31 March so the year's figures are complete and correct." },
      { k: "closing-entries", says: "entries that reset income and expenses to zero at year end, moving the profit to retained earnings." },
    ],
  },
  ledger: {
    what: <>One account at a time, with every entry that touched it and its running balance: the <strong>general ledger</strong>. The journal lists transactions by date; the ledger sorts the same lines by account, so you can see what&apos;s in the bank, what&apos;s owed, or what rent cost.</>,
    steps: [
      <>Choose an <strong>account</strong>. 100 Bank is a good place to start.</>,
      <>For debtors, creditors and the owners&apos; current accounts, pick a <strong>person</strong> to see just their part (the subsidiary ledger).</>,
      <>Tap any row to open the transaction and its source document.</>,
      <>Tick <strong>include closing entries</strong> to see income and expense accounts reset to zero at year end.</>,
    ],
    read: <><strong>Other side</strong> is the account the money came from or went to. <strong>Balance</strong> is the running total: a plain figure is a debit balance, and a figure with a minus sign is a credit balance. So a liability or income account normally shows a minus. The T-account beside it shows the same thing in the classic two-column form.</>,
    terms: [
      { k: "ledger", says: "the book with a page (an account) for each thing the business tracks." },
      { k: "posting", says: "copying each journal line to its account in the ledger." },
      { k: "normal-balance", says: "the side an account usually sits on: debit for assets and expenses, credit for liabilities, equity and income." },
      { k: "t-account", says: "an account drawn as a T: debits on the left, credits on the right." },
      { k: "control-account", says: "one account holding the total owed by (or to) everyone, like debtors." },
      { k: "subsidiary-ledger", says: "the detail behind a control account: one page per customer or supplier." },
    ],
  },
  "trial-balance": {
    what: <>A list of every account&apos;s balance on any day of year 1, in two columns: debits and credits. If the books are kept properly the two columns are equal. Above it, the <strong>accounting equation</strong> shows the same balances as assets = liabilities + equity.</>,
    steps: [
      <>Drag the <strong>date</strong> slider to any day of the year and watch the balances change.</>,
      <>At 31 March, tick <strong>include year-end adjustments</strong> to see the adjusted trial balance.</>,
    ],
    read: <>The two totals at the bottom always match. That proves every entry balanced, but not that every entry is right: a whole transaction left out, or posted to the wrong account, still balances. The coloured bar is the accounting equation: the left side (assets) always equals the right (liabilities and equity, including the profit so far).</>,
    terms: [
      { k: "trial-balance", says: "every account's balance, listed to check that debits equal credits." },
      { k: "accounting-equation", says: "assets = liabilities + equity. Every transaction keeps it true." },
      { k: "adjusted-trial-balance", says: "the trial balance after the year-end adjustments: the figures the statements are made from." },
      { k: "debit", says: "the left column." },
      { k: "credit", says: "the right column." },
    ],
  },
  statements: {
    what: <>Kōwhai&apos;s year 1 financial statements, made from the ledger for any part of the year: the <strong>profit and loss</strong> (how much profit it made) and the <strong>balance sheet</strong> (what it owns and owes on that day).</>,
    steps: [
      <>Drag the <strong>date</strong> slider. The profit and loss covers 1 April up to that date; the balance sheet is as at that date.</>,
      <>Switch between the two with the tabs.</>,
      <>Slide to <strong>31 March</strong> for the final statements, after the year-end adjustments.</>,
    ],
    read: <>Mid-year figures leave out the year-end adjustments (depreciation, the stocktake, accruals and tax), so profit looks higher than it really is until 31 March. On the balance sheet, assets always equal liabilities plus equity.</>,
    terms: [
      { k: "profit-and-loss", label: "Profit and loss", says: "income less expenses for a period: the profit." },
      { k: "balance-sheet", says: "what the business owns (assets) and owes (liabilities) on one day, and the owners' share (equity)." },
      { k: "gross-profit", says: "sales less the cost of the food and coffee sold." },
      { k: "net-profit", says: "what's left after every expense (and, after tax, after income tax too)." },
      { k: "current-asset", says: "cash, or something that becomes cash within a year." },
      { k: "current-liability", says: "a debt due within a year." },
      { k: "adjusting-entry", label: "Year-end adjustments", says: "the entries at 31 March that make the year's figures complete." },
    ],
  },
  ratios: {
    what: <>Ratios compare one figure with another, so the statements become easier to judge: is the café profitable enough, can it pay its bills, how long do customers take to pay? These use Kōwhai&apos;s final year 1 figures.</>,
    steps: [
      <>Read each card: the ratio&apos;s name, its value, how it&apos;s worked out, and what it means for a café.</>,
      <>The badge says whether it looks healthy against typical café figures, or is one to watch.</>,
    ],
    read: <>A ratio means little on its own. Compare it with last year, with similar businesses, or with a target. &quot;2.10 : 1&quot; means $2.10 of the first figure for every $1 of the second. &quot;Days&quot; ratios turn a balance into how many days of trading it represents.</>,
    terms: [
      { k: "gross-margin", says: "gross profit as a share of sales." },
      { k: "current-ratio", says: "current assets ÷ current liabilities: can it pay this year's bills?" },
      { k: "quick-ratio", label: "Quick ratio", says: "the same, but leaving out stock and prepayments, which can't pay a bill quickly." },
      { k: "liquidity", says: "how easily the business can pay what's due." },
      { k: "cost-of-goods-sold", says: "what the coffee, food and packaging sold actually cost." },
    ],
  },
  loan: {
    what: <>Kōwhai&apos;s bank loan, month by month: each repayment split into <strong>interest</strong> (the bank&apos;s charge, an expense) and <strong>principal</strong> (paying back what was borrowed). It&apos;s a table loan: the repayment is the same every month, but the split changes.</>,
    steps: [
      <>Scroll down the table: the interest part shrinks and the principal part grows as the loan is paid down.</>,
      <>Read the boxes beside it for how each repayment is recorded, and why the loan is split on the balance sheet.</>,
    ],
    read: <><strong>Opening</strong> is what&apos;s owed at the start of the month; <strong>Closing</strong> is after the repayment. In each bar, the first colour is interest and the second is principal. The shaded rows are year 1&apos;s repayments.</>,
    terms: [
      { k: "principal", says: "the amount borrowed, and the part of each repayment that pays it back." },
      { k: "interest", says: "the cost of borrowing: an expense in the profit and loss." },
      { k: "current-liability", says: "the next 12 months' principal: shown separately from the rest of the loan." },
    ],
  },
  "cash-forecast": {
    what: <>Profit isn&apos;t cash. This is Kōwhai&apos;s month-by-month plan for the bank balance in year 2, beside what really happened, so you can see when cash runs short even in a profitable year.</>,
    steps: [
      <>Look at the chart of the bank balance at each month&apos;s end, then tap a <strong>month</strong> to see its money in and out.</>,
      <>Read <strong>What happened</strong> for why that month was different.</>,
      <>In the full table, tick <strong>Show how each forecast figure was set</strong> to see where each number came from.</>,
    ],
    read: <><strong>Forecast</strong> is the plan, <strong>Actual</strong> is what happened, and <strong>Difference</strong> is actual minus forecast: green means more cash than planned, red means less. Bank and till are counted together.</>,
    terms: [
      { k: "cash-flow-forecast", says: "a plan of the money coming in and going out, month by month." },
      { k: "budget", says: "the plan for profit. The forecast is the plan for cash." },
      { k: "accrual-basis", says: "profit counts income when earned and costs when incurred, not when the money moves. That's why profit and cash differ." },
      { k: "variance", label: "Difference", says: "actual minus the plan." },
    ],
  },
  budget: {
    what: <>Kōwhai&apos;s plan for year 2&apos;s profit, line by line, beside what really happened. The gaps (variances) show where the year went better or worse than expected, and why.</>,
    steps: [
      <>Read <strong>Year 2 at a glance</strong> and its biggest differences.</>,
      <>Tick <strong>Flex the budget</strong> to resize the costs that rise with sales, so busier months aren&apos;t counted as overspending.</>,
      <>Tick <strong>Show how each budget figure was set</strong> to see the reasoning behind each line.</>,
    ],
    read: <>Each variance is actual minus budget. <strong>F</strong> (favourable) helps profit: more income, or lower costs. <strong>U</strong> (unfavourable) hurts it. A big variance isn&apos;t automatically bad. Ask why it happened.</>,
    terms: [
      { k: "budget", says: "the plan for the year in numbers." },
      { k: "variance", says: "actual minus budget: favourable (F) or unfavourable (U)." },
      { k: "flexible-budget", says: "the budget resized to the actual level of sales, for the costs that move with sales." },
      { k: "cost-of-goods-sold", says: "the cost of the coffee, food and packaging sold: it rises with sales." },
    ],
  },
  "break-even": {
    what: <>How much the café must sell each month just to cover its costs, with nothing left over. Below that it makes a loss, and above it a profit. The starting figures come from Kōwhai&apos;s year 1.</>,
    steps: [
      <>Move the <strong>average spend</strong>, <strong>variable costs</strong> and <strong>fixed costs</strong> sliders.</>,
      <>Watch the break-even sales and the customers needed each day.</>,
      <>Try the tip: raise the average spend by $1, or add a $4,000-a-month staff member.</>,
    ],
    read: <><strong>Variable costs</strong> rise with every sale (beans, milk, food, cups, card fees). <strong>Fixed costs</strong> stay the same however busy it is (rent, salaries, insurance). Each sale leaves a <strong>contribution margin</strong>, the sale less its variable cost, to pay the fixed costs. Break-even sales = fixed costs ÷ the contribution margin as a share of sales.</>,
    terms: [
      { k: "break-even", says: "the sales level where profit is exactly zero." },
      { k: "cost-of-goods-sold", says: "the biggest variable cost: what the food and drink sold cost." },
      { k: "gross-margin", says: "close to the contribution margin for a café: what's left of each sales dollar after the cost of what was sold." },
    ],
  },
};

/** the guide for an Explore tool, or nothing when the tool carries its own */
export function ExploreGuide({ tool }: { tool: string }) {
  const g = GUIDES[tool];
  return g ? <div className="mb-6"><ToolGuide {...g} /></div> : null;
}
