// Scores the generated fixtures (R1.3, R1.4, R-SCORE-5 to R-SCORE-9).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { analyze, type Analysis } from "../../src/shared/audio/index.ts";
import { scoreTrack, type CreditsInput, type LyricsInput, type TrackScore } from "../../src/shared/score";
import { readWav } from "../helpers/wav.ts";

const DIR = join(__dirname, "../../fixtures");
const lyrics: LyricsInput = JSON.parse(readFileSync(join(DIR, "sample.cues.json"), "utf8"));
const credits: CreditsInput = { title: "Lantern", artist: "Test Artist", writers: "Test Writer" };
const analysisOf = (n: string): Analysis => {
  const w = readWav(join(DIR, `${n}.wav`));
  return analyze(w.channels, w.sampleRate);
};
const A: Record<string, Analysis> = {};
const S: Record<string, TrackScore> = {};
for (const n of ["good", "bad", "cut", "silence", "clipped", "sample"]) A[n] = analysisOf(n);
// Same lyrics and credits for every fixture, so differences come from the audio.
for (const n of Object.keys(A)) S[n] = scoreTrack(A[n]!, lyrics, credits);
const mark = (n: string, id: string) => S[n]!.categories.find((c) => c.id === id)!;

describe("scoreTrack on fixtures", () => {
  it("prints the fixture table", () => {
    const rows = Object.keys(S).map((n) => `${n.padEnd(8)} total ${String(S[n]!.total).padStart(3)}  ` + S[n]!.categories.map((c) => `${c.id} ${c.mark.toFixed(1)}/${c.weight}`).join("  "));
    process.stdout.write("\n" + rows.join("\n") + "\n");
    expect(rows.length).toBe(6);
  });

  it("good scores clearly higher than bad", () => {
    expect(S.good!.total - S.bad!.total).toBeGreaterThanOrEqual(15);
  });

  it("good has full marks for loudness and clean edges", () => {
    expect(mark("good", "loudness").mark).toBe(25);
    expect(mark("good", "edges").mark).toBeGreaterThan(14.9);
  });

  it("silence scores low with a clear reason", () => {
    const audio = S.silence!.categories.filter((c) => ["loudness", "edges", "ending"].includes(c.id));
    expect(audio.reduce((t, c) => t + c.mark, 0)).toBeLessThan(10); // of 60 audio marks
    expect(S.silence!.total).toBeLessThan(S.good!.total - 25);
    expect(mark("silence", "loudness").mark).toBe(0);
    expect(mark("silence", "loudness").reason).toMatch(/No signal/);
    expect(mark("silence", "ending").reason).toMatch(/no signal/);
    expect(mark("silence", "edges").mark).toBeLessThan(8);
  });

  it("cut loses Length and ending marks for ending mid-signal", () => {
    const c = mark("cut", "ending");
    expect(c.reason).toMatch(/cut mid-signal/);
    expect(c.mark).toBeLessThan(10);
    expect(mark("sample", "ending").reason).toMatch(/ends clean/);
    expect(mark("sample", "ending").mark).toBeGreaterThan(c.mark);
  });

  it("bad loses marks for leading silence and for loudness", () => {
    expect(A.bad!.leadingSilenceSec).toBeGreaterThan(1.5);
    expect(mark("bad", "edges").mark).toBeLessThan(mark("good", "edges").mark - 2);
    expect(mark("bad", "edges").reason).toMatch(/Leading silence 2\.00 s/);
    const l = mark("bad", "loudness");
    expect(l.mark).toBeLessThan(10);
    expect(l.reason).toMatch(/clipped samples/);
    expect(l.measured.map((x) => x.name)).toEqual(["Integrated loudness", "True peak", "Clipped samples"]);
  });

  it("clipped loses loudness marks", () => {
    expect(mark("clipped", "loudness").mark).toBe(0);
  });

  it("every category states weight, reason and measured numbers", () => {
    for (const s of Object.values(S)) {
      expect(s.categories.map((c) => c.weight)).toEqual([25, 15, 25, 15, 20]);
      for (const c of s.categories) expect(c.reason.length).toBeGreaterThan(10);
    }
  });
});

describe("scoreTrack inputs", () => {
  it("missing lyrics and credits score 0 in those categories", () => {
    const s = scoreTrack(A.good!, null, null);
    expect(s.categories.find((c) => c.id === "lyrics")!.mark).toBe(0);
    expect(s.categories.find((c) => c.id === "metadata")!.mark).toBe(0);
  });

  it("credits count title, artist, writers equally", () => {
    const s = scoreTrack(A.good!, lyrics, { title: "x", artist: " " });
    expect(s.categories.find((c) => c.id === "metadata")!.mark).toBe(5);
  });

  it("out-of-order cues lose the monotonic marks", () => {
    const bad = { lines: [{ startMs: 5000, text: "a" }, { startMs: 1000, text: "b" }] };
    expect(scoreTrack(A.sample!, bad, credits).categories.find((c) => c.id === "lyrics")!.reason).toMatch(/out of order/);
  });

  it("duration inside 90-360 s earns full length marks", () => {
    const long = { ...A.sample!, durationSec: 200 };
    expect(scoreTrack(long, lyrics, credits).categories.find((c) => c.id === "ending")!.mark).toBe(20);
  });
});
