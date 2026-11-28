/**
 * "Do the GST return yourself": Kōwhai's twelve real GST periods as exercises, simpler ones first.
 * The logic is lib/study/gstReturn.ts. Plan: docs/GST-RETURN.md.
 */
import { ALL as Y1_ALL } from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { GST_PERIODS, gstPeriodsFor } from "@/lib/engine/gst";
import { buildExercise } from "@/lib/study/gstReturn";

const all = [
  ...GST_PERIODS.map((p) => buildExercise(`y1-${p.id}`, "Year 1", Y1_ALL, p)),
  ...gstPeriodsFor(2027, "Y2").map((p) => buildExercise(`y2-${p.id}`, "Year 2", Y2.ALL, p)),
];
/** the simpler periods in date order, then the harder ones (a refund or adjustments) */
export const GST_EXERCISES = [...all.filter((e) => e.level === "simpler"), ...all.filter((e) => e.level === "harder")];
