// Gate G2: the JS meter against ffmpeg ebur128 on every fixture (R1.1, R1.2).
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { analyze } from "../../src/shared/audio/index.ts";
import { readWav } from "../helpers/wav.ts";

const DIR = join(__dirname, "../../fixtures");
const names = readdirSync(DIR).filter((f) => f.endsWith(".oracle.json")).map((f) => f.replace(".oracle.json", ""));
const fmt = (v: number | null) => (v === null || v === -Infinity ? "-inf" : v.toFixed(3));

describe("meter vs ffmpeg ebur128 oracle (R1.1, R1.2)", () => {
  const rows: Record<string, string>[] = [];

  for (const name of names) {
    it(`${name}: integrated within 0.1 LU, true peak within 0.3 dB`, () => {
      const o = JSON.parse(readFileSync(join(DIR, `${name}.oracle.json`), "utf8"));
      const wav = readWav(join(DIR, `${name}.wav`));
      const a = analyze(wav.channels, wav.sampleRate);
      const dI = a.integratedLufs - o.integratedLufsPrecise;
      const tpOracle: number = o.truePeakDbtpPrecise === null ? -Infinity : o.truePeakDbtpPrecise;
      const dTp = a.truePeakDbtp === tpOracle ? 0 : a.truePeakDbtp - tpOracle;
      rows.push({
        fixture: name,
        "JS LUFS": fmt(a.integratedLufs),
        "ffmpeg LUFS": fmt(o.integratedLufsPrecise),
        "dI (LU)": dI.toFixed(3),
        "JS dBTP": fmt(a.truePeakDbtp),
        "ffmpeg dBTP": fmt(tpOracle),
        "dTP (dB)": Number.isNaN(dTp) ? "NaN" : dTp.toFixed(3),
        "JS LRA": a.loudnessRangeLu.toFixed(2),
        "ffmpeg LRA": fmt(o.loudnessRangeLu),
      });
      expect(Math.abs(dI)).toBeLessThanOrEqual(0.1);
      // also consistent with the 0.1-rounded summary value
      expect(Math.abs(a.integratedLufs - o.integratedLufs)).toBeLessThanOrEqual(0.15);
      expect(dTp).not.toBeNaN();
      expect(Math.abs(dTp)).toBeLessThanOrEqual(0.3);
      expect(a.sampleRate).toBe(o.sampleRate);
      expect(a.channels).toBe(o.channels);
      expect(Math.abs(a.durationSec - o.durationSec)).toBeLessThan(0.001);
      if (o.truePeakDbtp === null) expect(a.truePeakDbtp).toBe(-Infinity);
      if (name === "silence") expect(a.integratedLufs).toBe(-70);
      // LRA is informational (not in R1.x). ffmpeg reports 20.0 LU for the steady clipped tone
      // (its short-term histogram saturates near +2 LUFS), so that fixture is skipped.
      if (name !== "clipped") expect(Math.abs(a.loudnessRangeLu - o.loudnessRangeLu)).toBeLessThanOrEqual(0.3);
    });
  }

  it("covers at least six fixtures including silence, clipped, mono, 44.1 and 48 kHz", () => {
    expect(names.length).toBeGreaterThanOrEqual(6);
    for (const n of ["silence", "clipped", "mono", "sr44", "sr48"]) expect(names).toContain(n);
  });

  it("prints the JS vs ffmpeg table", () => {
    console.table(rows);
  });
});
