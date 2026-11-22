// Derived from .kiro/specs/score-rubric/requirements.md (R-SCORE-1 to R-SCORE-4) and plusg P1, P2 (R1.4).
import { describe, it } from "vitest";
import fc from "fast-check";
import { CATEGORIES, composeScore, type CategoryId } from "../../src/shared/rubric";
import { scoreTrack } from "../../src/shared/score";
import type { Analysis } from "../../src/shared/audio/analyze";

const wild = fc.oneof(
  fc.double({ noNaN: false }),
  fc.double({ min: -100, max: 20, noNaN: true }),
  fc.constantFrom(NaN, Infinity, -Infinity, 0, -70),
);
const analysis: fc.Arbitrary<Analysis> = fc.record({
  sampleRate: fc.constantFrom(24000, 44100, 48000),
  channels: fc.constantFrom(1, 2),
  durationSec: fc.oneof(wild, fc.double({ min: 0, max: 600, noNaN: true })),
  integratedLufs: wild,
  loudnessRangeLu: wild,
  truePeakDbtp: wild,
  samplePeakDbfs: wild,
  clippedSamples: fc.oneof(fc.nat(100000), wild),
  leadingSilenceSec: fc.oneof(wild, fc.double({ min: 0, max: 20, noNaN: true })),
  trailingSilenceSec: fc.oneof(wild, fc.double({ min: 0, max: 20, noNaN: true })),
  endingLevelDbfs: wild,
});
const lyrics = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.record({
    lines: fc.array(fc.record({ startMs: fc.oneof(wild, fc.integer({ min: 0, max: 600000 })), text: fc.string() }), { maxLength: 30 }),
  }),
);
const credits = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.record({ title: fc.option(fc.string(), { nil: undefined }), artist: fc.option(fc.string(), { nil: undefined }), writers: fc.option(fc.string(), { nil: undefined }) }),
);

describe("scoreTrack properties", () => {
  it("P1 / R-SCORE-1: total is an integer in 0-100 for any inputs", () => {
    fc.assert(
      fc.property(analysis, lyrics, credits, (a, l, c) => {
        const s = scoreTrack(a, l, c);
        return Number.isInteger(s.total) && s.total >= 0 && s.total <= 100;
      }),
    );
  });

  it("P2 / R-SCORE-2: every category mark is within 0 and its weight", () => {
    fc.assert(
      fc.property(analysis, lyrics, credits, (a, l, c) => {
        const s = scoreTrack(a, l, c);
        return s.categories.length === CATEGORIES.length && s.categories.every((k, i) => {
          const def = CATEGORIES[i]!;
          return k.id === def.id && k.weight === def.weight && Number.isFinite(k.mark) && k.mark >= 0 && k.mark <= def.weight;
        });
      }),
    );
  });

  it("R-SCORE-3: total is the rounded sum of category marks", () => {
    fc.assert(
      fc.property(analysis, lyrics, credits, (a, l, c) => {
        const s = scoreTrack(a, l, c);
        const marks = Object.fromEntries(s.categories.map((k) => [k.id, k.mark])) as Record<CategoryId, number>;
        return s.total === composeScore(marks) && s.total === Math.round(s.categories.reduce((t, k) => t + k.mark, 0));
      }),
    );
  });

  it("R-SCORE-4: every category has a one-line reason and measured values with units", () => {
    fc.assert(
      fc.property(analysis, lyrics, credits, (a, l, c) =>
        scoreTrack(a, l, c).categories.every(
          (k) => k.reason.length > 0 && !k.reason.includes("\n") && k.measured.length > 0 && k.measured.every((x) => x.unit.length > 0 && (x.value === null || Number.isFinite(x.value))),
        ),
      ),
    );
  });
});
