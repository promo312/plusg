// Derived from .kiro/specs/score-rubric/requirements.md (R-SCORE-1, R-SCORE-2).
import { describe, it } from "vitest";
import fc from "fast-check";
import { CATEGORIES, composeScore, type CategoryId } from "../../src/shared/rubric";

const anyMark = fc.oneof(fc.double({ noNaN: false }), fc.integer({ min: -1000, max: 1000 }));
const marks = fc.record(
  Object.fromEntries(CATEGORIES.map((c) => [c.id, anyMark])) as Record<CategoryId, fc.Arbitrary<number>>,
);

describe("composeScore properties", () => {
  it("R-SCORE-1: is always an integer in 0-100", () => {
    fc.assert(
      fc.property(marks, (m) => {
        const s = composeScore(m);
        return Number.isInteger(s) && s >= 0 && s <= 100;
      }),
    );
  });

  it("R-SCORE-2: a category can never contribute more than its weight", () => {
    fc.assert(
      fc.property(marks, (m) => {
        for (const c of CATEGORIES) {
          const only = Object.fromEntries(CATEGORIES.map((k) => [k.id, 0])) as Record<CategoryId, number>;
          only[c.id] = m[c.id];
          if (composeScore(only) > c.weight) return false;
        }
        return true;
      }),
    );
  });
});
