import { describe, expect, it } from "vitest";
import {
  analyze, countClipped, endingLevelDbfs, measureSilence, preFilterCoefficients, rlbFilterCoefficients, truePeakDbtp,
} from "../../src/shared/audio/index.ts";

const sine = (hz: number, sr: number, sec: number, amp: number) =>
  Float32Array.from({ length: Math.round(sr * sec) }, (_, n) => amp * Math.sin((2 * Math.PI * hz * n) / sr));

describe("K-weighting coefficients (R1.1)", () => {
  it("match the BS.1770-4 table values at 48 kHz", () => {
    const p = preFilterCoefficients(48000);
    expect(p.b0).toBeCloseTo(1.53512485958697, 9);
    expect(p.b1).toBeCloseTo(-2.69169618940638, 9);
    expect(p.b2).toBeCloseTo(1.19839281085285, 9);
    expect(p.a1).toBeCloseTo(-1.69065929318241, 9);
    expect(p.a2).toBeCloseTo(0.73248077421585, 9);
    const r = rlbFilterCoefficients(48000);
    expect(r.a1).toBeCloseTo(-1.99004745483398, 9);
    expect(r.a2).toBeCloseTo(0.99007225036621, 9);
  });
});

describe("meter basics (R1.1)", () => {
  it("measures a 997 Hz sine at -20 dBFS peak as -23 LUFS (mono) and -20 LUFS (dual mono)", () => {
    const x = sine(997, 48000, 5, 0.1);
    const a = analyze([x], 48000);
    expect(analyze([x, x], 48000).integratedLufs).toBeCloseTo(-20.0, 1);
    expect(a.integratedLufs).toBeCloseTo(-23.0, 1);
    expect(a.truePeakDbtp).toBeCloseTo(-20, 1);
    expect(a.durationSec).toBeCloseTo(5, 6);
  });

  it("returns -70 LUFS and -Infinity true peak for silence", () => {
    const a = analyze([new Float32Array(48000 * 2)], 48000);
    expect(a.integratedLufs).toBe(-70);
    expect(a.truePeakDbtp).toBe(-Infinity);
    expect(a.endingLevelDbfs).toBe(-Infinity);
    expect(a.loudnessRangeLu).toBe(0);
  });

  it("handles tracks shorter than one block and empty input without NaN", () => {
    expect(analyze([new Float32Array(100).fill(0.1)], 48000).integratedLufs).toBe(-70);
    const e = analyze([], 48000);
    expect(e.durationSec).toBe(0);
    expect(Number.isNaN(e.integratedLufs)).toBe(false);
  });

  it("finds an inter-sample peak above the sample peak", () => {
    // fs/4 tone at 45 degrees: every sample is +-0.7071*A, true peak is A
    const x = Float32Array.from({ length: 4800 }, (_, n) => Math.sin((Math.PI / 2) * n + Math.PI / 4));
    expect(truePeakDbtp([x])).toBeGreaterThan(-0.05);
    expect(analyze([x], 48000).samplePeakDbfs).toBeCloseTo(-3.01, 1);
  });

  it("counts clipped samples at 16-bit full scale", () => {
    const x = Float32Array.from([0, 1, -1, 32767 / 32768, 0.5, -32768 / 32768]);
    expect(countClipped([x])).toBe(4);
  });

  it("measures leading and trailing silence at -50 dBFS", () => {
    const sr = 1000;
    const x = new Float32Array(3000);
    x.fill(0.5, 500, 2000);
    x[100] = 0.001; // -60 dBFS, below the threshold
    const s = measureSilence([x], sr);
    expect(s.leadingSilenceSec).toBeCloseTo(0.5, 6);
    expect(s.trailingSilenceSec).toBeCloseTo(1.0, 6);
    expect(measureSilence([new Float32Array(2000)], sr)).toEqual({ leadingSilenceSec: 2, trailingSilenceSec: 0 });
  });

  it("measures the ending level as RMS over the last 500 ms", () => {
    const sr = 1000;
    const x = new Float32Array(2000);
    x.fill(0.5, 1500);
    expect(endingLevelDbfs([x], sr)).toBeCloseTo(20 * Math.log10(0.5), 6);
    x.fill(0, 1500);
    expect(endingLevelDbfs([x], sr)).toBe(-Infinity);
  });
});
