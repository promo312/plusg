// Pure helpers for the load step: limits, number formatting, error mapping.
export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_DURATION_SEC = 10 * 60;

export type LoadErrorCode = "unsupported" | "too-large" | "undecodable" | "empty" | "too-long" | "unknown";

export class LoadError extends Error {
  constructor(public readonly code: LoadErrorCode) {
    super(code);
    this.name = "LoadError";
  }
}

export const LOAD_MESSAGES: Record<LoadErrorCode, string> = {
  unsupported: "This file is not a WAV or MP3. Choose a .wav or .mp3 file.",
  "too-large": "This file is larger than 100 MB. Choose a smaller WAV or MP3.",
  undecodable: "This file could not be decoded as audio. It may be damaged. Try exporting it again as WAV or MP3.",
  empty: "This file has no audio in it. Choose a track that plays.",
  "too-long": "This track is longer than 10 minutes. Choose a shorter one.",
  unknown: "Something went wrong while loading this file. Try again, or try the sample.",
};

export function loadErrorMessage(e: unknown): string {
  return LOAD_MESSAGES[e instanceof LoadError ? e.code : "unknown"];
}

/** Checks that can run before decoding. Returns null when the file may be tried. */
export function checkFileBeforeDecode(f: { name: string; size: number; type?: string }): LoadErrorCode | null {
  const okExt = /\.(wav|wave|mp3)$/i.test(f.name);
  const okType = /^audio\/(wav|x-wav|wave|vnd\.wave|mpeg|mp3)$/i.test(f.type ?? "");
  if (!okExt && !okType) return "unsupported";
  if (f.size <= 0) return "empty";
  if (f.size > MAX_FILE_BYTES) return "too-large";
  return null;
}

/** Checks on decoded audio. Returns null when the audio can be measured. */
export function checkDecoded(channels: readonly { length: number }[], sampleRate: number): LoadErrorCode | null {
  const len = channels[0]?.length ?? 0;
  if (channels.length === 0 || len === 0 || !(sampleRate > 0)) return "empty";
  if (len / sampleRate > MAX_DURATION_SEC) return "too-long";
  return null;
}

/** Sample rate from a RIFF/WAVE header, or null if the bytes are not a WAV header. */
export function wavSampleRate(bytes: Uint8Array): number | null {
  if (bytes.length < 28) return null;
  const tag = (o: number) => String.fromCharCode(bytes[o]!, bytes[o + 1]!, bytes[o + 2]!, bytes[o + 3]!);
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return null;
  let o = 12;
  while (o + 8 <= bytes.length) {
    const size = (bytes[o + 4]! | (bytes[o + 5]! << 8) | (bytes[o + 6]! << 16) | (bytes[o + 7]! << 24)) >>> 0;
    if (tag(o) === "fmt " && o + 16 <= bytes.length) {
      const sr = (bytes[o + 12]! | (bytes[o + 13]! << 8) | (bytes[o + 14]! << 16) | (bytes[o + 15]! << 24)) >>> 0;
      return sr > 0 ? sr : null;
    }
    o += 8 + size + (size & 1);
  }
  return null;
}

/** Display text for a measured value. null (missing, or -Infinity from the scorer) shows as "no signal". */
export function formatMeasured(value: number | null, unit: string): string {
  if (value === null || !Number.isFinite(value)) return "no signal";
  const digits = unit === "samples" || unit === "lines" || unit === "of 3" ? 0 : unit === "s" ? 2 : 1;
  const text = value.toFixed(digits);
  return unit === "%" ? `${text}%` : `${text} ${unit}`;
}
