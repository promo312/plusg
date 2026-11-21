import { describe, expect, it } from "vitest";
import { CATEGORIES } from "../../src/shared/rubric";

describe("rubric", () => {
  it("weights sum to 100", () => {
    expect(CATEGORIES.reduce((s, c) => s + c.weight, 0)).toBe(100);
  });
});
