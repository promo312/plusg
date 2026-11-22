import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIR = join(__dirname, "../../fixtures");
const REQUIRED = ["good", "bad", "cut", "silence", "clipped", "mono", "sr44", "sr48", "sample"];
const wavs = () => readdirSync(DIR).filter((f) => f.endsWith(".wav")).map((f) => f.slice(0, -4));
const oracle = (n: string) => JSON.parse(readFileSync(join(DIR, `${n}.oracle.json`), "utf8"));

describe("fixtures (R4.3)", () => {
  it("contain every required fixture", () => {
    for (const n of REQUIRED) expect(existsSync(join(DIR, `${n}.wav`)), n).toBe(true);
  });

  it("have an oracle file for every wav", () => {
    for (const n of wavs()) expect(existsSync(join(DIR, `${n}.oracle.json`)), n).toBe(true);
  });

  it("have valid oracle values", () => {
    for (const n of wavs()) {
      const o = oracle(n);
      expect(o.file).toBe(`${n}.wav`);
      expect(o.source).toBe("ffmpeg ebur128=peak=true");
      expect(o.integratedLufs).toBeGreaterThanOrEqual(-70);
      expect(o.integratedLufs).toBeLessThanOrEqual(10);
      expect(o.loudnessRangeLu).toBeGreaterThanOrEqual(0);
      expect(o.loudnessRangeLu).toBeLessThanOrEqual(30);
      if (o.truePeakDbtp !== null) {
        expect(o.truePeakDbtp).toBeGreaterThan(-100);
        expect(o.truePeakDbtp).toBeLessThanOrEqual(6);
      }
      expect([24000, 44100, 48000]).toContain(o.sampleRate);
      expect([1, 2]).toContain(o.channels);
      expect(o.durationSec).toBeGreaterThan(1);
      expect(o.durationSec).toBeLessThan(60);
    }
  });

  it("match the documented shape of each fixture", () => {
    expect(oracle("silence").integratedLufs).toBe(-70);
    expect(oracle("silence").truePeakDbtp).toBeNull();
    expect(oracle("good").integratedLufs).toBeCloseTo(-14, 0);
    expect(oracle("good").channels).toBe(2);
    expect(oracle("mono").channels).toBe(1);
    expect(oracle("bad").sampleRate).toBe(44100);
    expect(oracle("sr44").sampleRate).toBe(44100);
    expect(oracle("sr48").sampleRate).toBe(48000);
    expect(oracle("bad").integratedLufs).toBeLessThan(-20);
    expect(oracle("clipped").truePeakDbtp).toBeGreaterThan(-0.1);
  });

  it("keep size budgets", () => {
    let total = 0;
    for (const f of readdirSync(DIR)) {
      const size = statSync(join(DIR, f)).size;
      total += size;
      expect(size, f).toBeLessThan(2.1 * 1024 * 1024);
    }
    expect(total).toBeLessThan(15 * 1024 * 1024);
  });

  it("ship sample cues that are monotonic, non-negative and within the track", () => {
    const cues = JSON.parse(readFileSync(join(DIR, "sample.cues.json"), "utf8"));
    const durMs = oracle("sample").durationSec * 1000;
    expect(cues.file).toBe("sample.wav");
    expect(cues.lines.length).toBeGreaterThan(0);
    let prev = -1;
    for (const l of cues.lines) {
      expect(Number.isInteger(l.startMs)).toBe(true);
      expect(l.startMs).toBeGreaterThanOrEqual(0);
      expect(l.startMs).toBeGreaterThan(prev);
      expect(l.startMs).toBeLessThan(durMs);
      expect(l.text.length).toBeGreaterThan(0);
      prev = l.startMs;
    }
    const txt = readFileSync(join(DIR, "sample.lyrics.txt"), "utf8").trim().split("\n");
    expect(txt).toEqual(cues.lines.map((l: { text: string }) => l.text));
  });
});
