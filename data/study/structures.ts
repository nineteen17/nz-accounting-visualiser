/**
 * Which structure? Who pays the tax, which returns, who can use a loss, who's liable, the LTC owner limit,
 * ACC on profit or salary, and the tax on a partner's share. Figures from lib/nz/structures.ts and the year's rates.
 */
import { RATES } from "@/data/books/structures";
import { extraTax } from "@/lib/nz/structures";
import { $, $$, int, mc, num, pick, type Drill, type Question, type Rng } from "./core";

const STRUCT = ["Sole trader", "Partnership", "Company", "Look-through company"] as const;

const FACTS: { q: string; answer: string; wrong: string[]; why: string }[] = [
  { q: "Who pays income tax on a **partnership's** profit?", answer: "Each partner, on their share, in their own IR3", wrong: ["The partnership, at 28%", "The partnership, at the top partner's rate", "Nobody until it's drawn out"],
    why: "A partnership is transparent for tax (Income Tax Act s HG 2). It files an IR7 showing each partner's share, and each partner pays tax on that share at their own rates, drawn or not." },
  { q: "Who pays income tax on a **look-through company's** profit?", answer: "Each owner, on their share, as if it were a partnership", wrong: ["The company, at 28%", "The company at 28%, then the owners on dividends", "Only owners who work in it"],
    why: "An LTC is a company in law but transparent for income tax (s HB 1): the owners are taxed on its income, like partners." },
  { q: "Which of these can set a share of the business's **loss** against their other income this year?", answer: "A partner in a partnership", wrong: ["A shareholder in an ordinary company", "A director of an ordinary company", "Nobody: losses are always carried forward"],
    why: "In a partnership (or LTC) the loss flows to the owners, who can use it against other income. An ordinary company's loss stays in the company, carried forward." },
  { q: "How many look-through counted owners can an LTC have?", answer: "5 or fewer, counting relatives as one", wrong: ["Up to 25", "Any number", "Exactly 2"],
    why: "The definition of a look-through company (s YA 1) allows 5 or fewer look-through counted owners, treating relatives as one person." },
  { q: "If a **partnership** can't pay its debts, who is liable?", answer: "The partners, jointly, for all the firm's debts", wrong: ["Only the partnership's assets", "Only the partner who signed the contract", "Nobody: the debt is written off"],
    why: "Under the Partnership Law Act 2019 s 22, every partner is liable jointly with the others for all the firm's debts incurred while they're a partner. Their own assets are at risk." },
  { q: "Kōwhai is a company, so Aroha and Ben have limited liability. Why are they still personally at risk for the **bank loan**?", answer: "They gave the bank personal guarantees", wrong: ["Shareholders are always liable for loans", "Directors are liable for all company debts", "Because they own more than 50%"],
    why: "A shareholder isn't liable for the company's debts just for owning shares (Companies Act s 97). But banks usually ask small-company directors for personal guarantees, and Kōwhai's loan has them." },
  { q: "In an ordinary company, which payments to the owners carry **ACC levies**?", answer: "Shareholder salaries only", wrong: ["Dividends only", "Both salaries and dividends", "Neither"],
    why: "ACC levies are on earnings from work. A shareholder salary is, so ACC invoices levies on it; a dividend is a return on shares, with no levy. In a partnership the whole share of profit is liable." },
  { q: "Which return does a **sole trader** file for the business?", answer: "Only their own IR3", wrong: ["An IR4", "An IR7 and an IR3", "An IR7L"],
    why: "A sole trader and the business are the same person for tax: the profit goes in their IR3. (IR4 is a company's return; IR7 a partnership's or LTC's.)" },
  { q: "Which structure lets a working owner be paid a **salary through PAYE** while being taxed like a partnership?", answer: "Look-through company", wrong: ["Sole trader", "Partnership", "None of them"],
    why: "An LTC can pay a working owner a salary under a written employment contract (s DC 3B), and PAYE applies to it. A sole trader can't pay themselves a salary." },
];

function structQuestion(rng: Rng): Question {
  const r = rng();

  // the extra tax on a partner's share, on top of other income
  if (r < 0.25) {
    const other = pick(rng, [0, 30_000, 60_000, 90_000]);
    const share = int(rng, 8, 60) * 1_000;
    const t = extraTax(other, share, RATES).tax;
    return num(`A partner earns ${$$(other)} from a job elsewhere${other ? " (taxed through PAYE)" : ""} and their share of the partnership's profit is ${$$(share)}. Using the ${RATES.year} rates (IETC included), how much **extra** income tax does the share cost them?`,
      t,
      `Tax on ${$$(other + share)} minus the tax on ${$$(other)} alone (already paid${other ? " through PAYE" : ""}): **${$(t)}**. The share is taxed on top of their other income, at their own rates, whether they draw it or not.`,
      { tolerance: 1, hint: "To the nearest dollar" });
  }

  // a loss against other income
  if (r < 0.4) {
    const other = pick(rng, [50_000, 70_000, 90_000, 120_000]);
    const loss = int(rng, 4, 30) * 1_000;
    const back = -extraTax(other, -loss, RATES).tax;
    return num(`An LTC owner earns ${$$(other)} in a job (taxed through PAYE). Their share of the LTC's loss is ${$$(loss)}. How much tax do they get back?`,
      back,
      `Their taxable income drops from ${$$(other)} to ${$$(other - loss)}, so they get back the difference in tax: **${$(back)}**. In an ordinary company, the loss would stay in the company until it made a profit.`,
      { tolerance: 1, hint: "To the nearest dollar" });
  }

  const f = pick(rng, FACTS);
  return mc(rng, f.answer, f.wrong, f.q, f.why);
}

export const STRUCTURES_DRILLS: Drill[] = [
  { key: "structures", group: "nz", part: 1, title: "Which structure?", icon: "🏛️", blurb: `${STRUCT.join(", ")}: who's taxed, which returns, losses, liability and ACC.`, learn: { href: "/explore/structures", label: "Which structure?" }, make: structQuestion },
];
