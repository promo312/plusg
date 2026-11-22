// Property tests for the meter. Requirement: R1.1 (loudness and true peak are measured correctly).
import { describe, it } from "vitest";
import fc from "fast-check";
import { analyze, samplePeakLinear, truePeakLinear } from "../../src/shared/audio/index.ts";

const SR = 48000;
const noiseTone = (seed: number, amp: number, hz: number) => {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
  return Float32Array.from({ length: SR * 2 }, (_, n) => amp * (0.6 * Math.sin((2 * Math.PI * hz * n) / SR) + 0.4 * rnd()));
};

describe("meter properties", () => {
  it("R1.1: gain of g dB shifts integrated loudness by g (within 0.01 LU) above the gates", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.double({ min: 100, max: 4000, noNaN: true }), fc.double({ min: -12, max: 12, noNaN: true }), (seed, hz, g) => {
        const x = noiseTone(seed, 0.1, hz);
        const k = Math.pow(10, g / 20);
        const y = Float32Array.from(x, (v) => v * k);
        const d = analyze([y], SR).integratedLufs - analyze([x], SR).integratedLufs;
        return Math.abs(d - g) <= 0.01;
      }),
      { numRuns: 25 },
    );
  });

  it("R1.1: true peak is never below sample peak", () => {
    fc.assert(
      fc.property(fc.array(fc.double({ min: -1, max: 1, noNaN: true }), { minLength: 1, maxLength: 600 }), (v) => {
        const x = Float32Array.from(v);
        return truePeakLinear([x]) >= samplePeakLinear([x]);
      }),
      { numRuns: 100 },
    );
  });
});
