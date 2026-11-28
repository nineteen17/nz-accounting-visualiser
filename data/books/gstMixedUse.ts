/**
 * Examples for the GST mixed-use tool. Aroha's car and laptop are a "what if": Aroha running the café as a sole
 * trader (the Which structure? world). Kōwhai's figures (interest, entertainment, sales) come from its books.
 */
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { balances } from "@/lib/engine/ledger";
import { r2 } from "@/lib/money";
import { underDeMinimis } from "@/lib/nz/gstMixedUse";

export const CAR = {
  costExcl: 28_000,
  intendedUse: 0.6,
  /** business use in each 12-month adjustment period: the learner can change these */
  defaultUses: [0.5, 0.55, 0.45, 0.9, 0.6],
  salePriceIncl: 15_000,
};

export const LAPTOP = { costExcl: 2_400, defaultUse: 0.7 };

/** a van Kōwhai (the company) might buy for catering, which Ben takes home: the fringe benefit route */
export const VAN = { costExcl: 35_000 };

const b1 = balances(Y1.BEFORE_CLOSING);
const interestY1 = r2(-(b1["450"] ?? 0));
const suppliesY1 = r2(-(b1["400"] ?? 0) - (b1["410"] ?? 0) + interestY1);

export const KOWHAI = {
  /** year 1's bank interest: an exempt supply (financial services) */
  interestY1,
  /** year 1's taxable and exempt supplies together (café and catering sales, interest) */
  suppliesY1,
  underDeMinimis: underDeMinimis(interestY1, suppliesY1),
  /** year 2's entertainment GST adjustment: the same "claim in full, pay back the non-business part" idea (s 21I(4)) */
  entertainmentGstY2: Y2.YEAR2_FACTS.entAdj,
};
