import { describe, expect, it } from "vitest";
import {
  LOAD_MESSAGES,
  LoadError,
  MAX_DURATION_SEC,
  MAX_FILE_BYTES,
  checkDecoded,
  checkFileBeforeDecode,
  formatMeasured,
  loadErrorMessage,
  wavSampleRate,
} from "../../src/shared/load";
import { readFileSync } from "node:fs";

describe("formatMeasured (R1.4)", () => {
  it("formats with units", () => {
    expect(formatMeasured(-19.04, "LUFS")).toBe("-19.0 LUFS");
    expect(formatMeasured(1.5, "s")).toBe("1.50 s");
    expect(formatMeasured(12, "samples")).toBe("12 samples");
    expect(formatMeasured(66.7, "%")).toBe("66.7%");
  });
  it("shows null and non-finite as no signal", () => {
    expect(formatMeasured(null, "dBTP")).toBe("no signal");
    expect(formatMeasured(-Infinity, "dBTP")).toBe("no signal");
  });
});

describe("load errors (R1.6)", () => {
  it("maps every code to a plain message", () => {
    for (const code of Object.keys(LOAD_MESSAGES) as (keyof typeof LOAD_MESSAGES)[]) {
      expect(loadErrorMessage(new LoadError(code))).toBe(LOAD_MESSAGES[code]);
    }
    expect(loadErrorMessage(new Error("boom"))).toBe(LOAD_MESSAGES.unknown);
  });
  it("rejects wrong type, empty and oversize files before decoding", () => {
    expect(checkFileBeforeDecode({ name: "a.flac", size: 10, type: "audio/flac" })).toBe("unsupported");
    expect(checkFileBeforeDecode({ name: "a.wav", size: 0 })).toBe("empty");
    expect(checkFileBeforeDecode({ name: "a.mp3", size: MAX_FILE_BYTES + 1 })).toBe("too-large");
    expect(checkFileBeforeDecode({ name: "A.WAV", size: 10 })).toBeNull();
    expect(checkFileBeforeDecode({ name: "x", size: 10, type: "audio/mpeg" })).toBeNull();
  });
  it("rejects empty and too-long decoded audio", () => {
    expect(checkDecoded([], 44100)).toBe("empty");
    expect(checkDecoded([new Float32Array(0)], 44100)).toBe("empty");
    expect(checkDecoded([{ length: 44100 * (MAX_DURATION_SEC + 1) }], 44100)).toBe("too-long");
    expect(checkDecoded([new Float32Array(100)], 44100)).toBeNull();
  });
});

describe("wavSampleRate", () => {
  it("reads the sample rate from the sample fixture", () => {
    expect(wavSampleRate(new Uint8Array(readFileSync("fixtures/sample.wav")))).toBe(24000);
  });
  it("returns null for non-WAV bytes", () => {
    expect(wavSampleRate(new Uint8Array(64))).toBeNull();
    expect(wavSampleRate(new Uint8Array(4))).toBeNull();
  });
});
